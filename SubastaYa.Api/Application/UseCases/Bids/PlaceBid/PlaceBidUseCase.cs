using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Application.DTOs.Bids;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;
using SubastaYa.Api.Domain.Exceptions;

namespace SubastaYa.Api.Application.UseCases.Bids.PlaceBid;

public class PlaceBidUseCase
{
    private readonly IAuctionRepository _auctionRepository;
    private readonly IBidRepository _bidRepository;
    private readonly IWalletService _walletService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogRepository _auditLogRepository;

    public PlaceBidUseCase(
        IAuctionRepository auctionRepository, 
        IBidRepository bidRepository, 
        IWalletService walletService, 
        IUnitOfWork unitOfWork,
        IAuditLogRepository auditLogRepository)
    {
        _auctionRepository = auctionRepository;
        _bidRepository = bidRepository;
        _walletService = walletService;
        _unitOfWork = unitOfWork;
        _auditLogRepository = auditLogRepository;
    }

    public async Task ExecuteAsync(int auctionId, string bidderId, PlaceBidRequestDto request, CancellationToken cancellationToken = default)
    {
        var auction = await _auctionRepository.GetByIdAsync(auctionId, cancellationToken);
        if (auction == null)
            throw new DomainException($"La subasta con ID {auctionId} no existe.");

        if (auction.State != AuctionState.Active)
            throw new DomainException("La subasta no está activa.");

        if (DateTime.UtcNow < auction.StartTime || DateTime.UtcNow > auction.EndTime)
            throw new DomainException("La subasta no se encuentra en período de pujas.");

        if (request.Amount <= auction.CurrentPrice)
            throw new DomainException($"El monto de la puja debe ser mayor a {auction.CurrentPrice}.");

        var highestBid = await _bidRepository.GetHighestBidForAuctionAsync(auctionId, cancellationToken);

        // 1. Validar fondos
        var hasFunds = await _walletService.HasSufficientBalanceAsync(bidderId, request.Amount, cancellationToken);
        if (!hasFunds)
            throw new DomainException("No tienes fondos suficientes en tu billetera.");

        // 2. Liberar saldo del postor anterior y retener del nuevo (Escrow)
        await _walletService.ReplaceHoldAsync(
            previousBidderId: highestBid?.BidderId,
            previousAmount: highestBid?.Amount,
            newBidderId: bidderId,
            newAmount: request.Amount,
            auctionId: auctionId,
            ct: cancellationToken
        );

        // 3. Registrar nueva puja
        var bid = new Bid
        {
            AuctionId = auctionId,
            BidderId = bidderId,
            Amount = request.Amount,
            Timestamp = DateTime.UtcNow
        };
        await _bidRepository.AddAsync(bid, cancellationToken);

        // 4. Actualizar subasta
        auction.CurrentPrice = request.Amount;

        // Anti-sniping: si falta menos de 60 segundos, sumar 2 minutos
        var timeLeft = auction.EndTime - DateTime.UtcNow;
        if (timeLeft.TotalSeconds < 60)
        {
            auction.EndTime = auction.EndTime.AddMinutes(2);
            await _auditLogRepository.AddAsync(new AuditLog
            {
                Action = "AntiSnipingRuleTriggered",
                UserId = bidderId,
                Details = $"Extensión de 2 minutos aplicada a la subasta {auctionId}. Nueva fecha de fin: {auction.EndTime:O}",
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }

        await _auctionRepository.UpdateAsync(auction, cancellationToken);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DomainException("Otra puja fue realizada al mismo tiempo. Por favor, intenta de nuevo con un monto mayor.");
        }
    }
}
