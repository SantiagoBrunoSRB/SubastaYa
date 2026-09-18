using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;

namespace SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;

public class CreateAuctionUseCase
{
    private readonly IAuctionRepository _auctionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateAuctionUseCase(IAuctionRepository auctionRepository, IUnitOfWork unitOfWork)
    {
        _auctionRepository = auctionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> ExecuteAsync(CreateAuctionRequestDto request, string sellerId, CancellationToken cancellationToken = default)
    {
        var auction = new Auction
        {
            Title = request.Title,
            Description = request.Description,
            StartingPrice = request.StartingPrice,
            CurrentPrice = request.StartingPrice,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SellerId = sellerId,
            ImageUrl = request.ImageUrl,
            State = AuctionState.Active
        };

        await _auctionRepository.AddAsync(auction, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return auction.Id;
    }
}
