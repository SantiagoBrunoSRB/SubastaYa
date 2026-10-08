using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;
using SubastaYa.Api.Domain.Exceptions;

namespace SubastaYa.Api.Application.UseCases.Bids.PlaceBid;

public class PlaceBidHandler : ICommandHandler<PlaceBidCommand>
{
    private readonly IAuctionRepository _auctionRepository;
    private readonly IBidRepository _bidRepository;
    private readonly IWalletService _walletService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogRepository _auditLogRepository;

    public PlaceBidHandler(
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

    public async Task HandleAsync(PlaceBidCommand command, CancellationToken ct = default)
    {
        // --- Validaciones (sin efectos secundarios, fuera de transacción) ---
        var auction = await _auctionRepository.GetByIdAsync(command.AuctionId, ct)
            ?? throw new DomainException($"La subasta con ID {command.AuctionId} no existe.");

        if (auction.State != AuctionState.Active)
            throw new DomainException("La subasta no está activa.");

        if (DateTime.UtcNow < auction.StartTime || DateTime.UtcNow > auction.EndTime)
            throw new DomainException("La subasta no se encuentra en período de pujas.");

        if (command.Amount <= auction.CurrentPrice)
            throw new DomainException($"El monto de la puja debe ser mayor a {auction.CurrentPrice}.");

        var hasFunds = await _walletService.HasSufficientBalanceAsync(command.BidderId, command.Amount, ct);
        if (!hasFunds)
            throw new DomainException("No tienes fondos suficientes en tu billetera.");

        var highestBid = await _bidRepository.GetHighestBidForAuctionAsync(command.AuctionId, ct);

        // --- Una sola transacción que abarca TODO ---
        await using var tx = await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            // 1. Fondos: liberar anterior + retener nuevo (sin TX interna propia)
            await _walletService.ReplaceHoldAsync(
                previousBidderId: highestBid?.BidderId,
                previousAmount: highestBid?.Amount,
                newBidderId: command.BidderId,
                newAmount: command.Amount,
                auctionId: command.AuctionId,
                ct: ct);

            // 2. Registrar nueva puja
            var bid = new Bid
            {
                AuctionId = command.AuctionId,
                BidderId = command.BidderId,
                Amount = command.Amount,
                Timestamp = DateTime.UtcNow
            };
            await _bidRepository.AddAsync(bid, ct);

            // 3. Actualizar subasta (el RowVersion se verifica en SaveChanges)
            auction.CurrentPrice = command.Amount;

            // Anti-sniping: si falta menos de 60 segundos, extender 2 minutos
            var timeLeft = auction.EndTime - DateTime.UtcNow;
            if (timeLeft.TotalSeconds < 60)
            {
                auction.EndTime = auction.EndTime.AddMinutes(2);
                await _auditLogRepository.AddAsync(new AuditLog
                {
                    Action = "AntiSnipingRuleTriggered",
                    UserId = command.BidderId,
                    Details = $"Extensión de 2 minutos aplicada a la subasta {command.AuctionId}. Nueva fecha de fin: {auction.EndTime:O}",
                    Timestamp = DateTime.UtcNow
                }, ct);
            }

            await _auctionRepository.UpdateAsync(auction, ct);

            // 4. Un único SaveChanges — verifica RowVersion de Auction y Wallet
            await _unitOfWork.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            await tx.RollbackAsync(ct);
            throw new ConcurrencyException("La subasta fue modificada por otra puja simultánea. Intente de nuevo.");
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
