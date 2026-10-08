using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;

namespace SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;

public class CreateAuctionHandler : ICommandHandler<CreateAuctionCommand, int>
{
    private readonly IAuctionRepository _auctionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateAuctionHandler(IAuctionRepository auctionRepository, IUnitOfWork unitOfWork)
    {
        _auctionRepository = auctionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> HandleAsync(CreateAuctionCommand command, CancellationToken ct = default)
    {
        var auction = new Auction
        {
            Title = command.Request.Title,
            Description = command.Request.Description,
            StartingPrice = command.Request.StartingPrice,
            CurrentPrice = command.Request.StartingPrice,
            StartTime = command.Request.StartTime,
            EndTime = command.Request.EndTime,
            SellerId = command.SellerId,
            ImageUrl = command.Request.ImageUrl,
            State = AuctionState.Active
        };

        await _auctionRepository.AddAsync(auction, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return auction.Id;
    }
}
