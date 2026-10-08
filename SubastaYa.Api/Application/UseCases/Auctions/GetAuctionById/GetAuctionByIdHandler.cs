using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.DTOs.Bids;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Domain.Exceptions;

namespace SubastaYa.Api.Application.UseCases.Auctions.GetAuctionById;

public class GetAuctionByIdHandler : IQueryHandler<GetAuctionByIdQuery, AuctionDetailResponseDto>
{
    private readonly IAuctionRepository _auctionRepository;

    public GetAuctionByIdHandler(IAuctionRepository auctionRepository)
    {
        _auctionRepository = auctionRepository;
    }

    public async Task<AuctionDetailResponseDto> HandleAsync(GetAuctionByIdQuery query, CancellationToken ct = default)
    {
        var auction = await _auctionRepository.GetByIdAsync(query.Id, ct)
            ?? throw new DomainException($"La subasta con ID {query.Id} no existe.");

        return new AuctionDetailResponseDto
        {
            Id = auction.Id,
            Title = auction.Title,
            Description = auction.Description,
            StartingPrice = auction.StartingPrice,
            CurrentPrice = auction.CurrentPrice,
            SellerId = auction.SellerId,
            StartTime = auction.StartTime,
            EndTime = auction.EndTime,
            State = auction.State,
            ImageUrl = auction.ImageUrl,
            Bids = auction.Bids
                .Select(b => new BidDto
                {
                    Id = b.Id,
                    BidderId = b.BidderId,
                    Amount = b.Amount,
                    Timestamp = b.Timestamp
                })
                .OrderByDescending(b => b.Amount)
                .ToList()
        };
    }
}
