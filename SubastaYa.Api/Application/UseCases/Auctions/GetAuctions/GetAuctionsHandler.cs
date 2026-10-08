using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.Interfaces.Persistence;

namespace SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;

public class GetAuctionsHandler : IQueryHandler<GetAuctionsQuery, IEnumerable<AuctionResponseDto>>
{
    private readonly IAuctionRepository _auctionRepository;

    public GetAuctionsHandler(IAuctionRepository auctionRepository)
    {
        _auctionRepository = auctionRepository;
    }

    public async Task<IEnumerable<AuctionResponseDto>> HandleAsync(GetAuctionsQuery query, CancellationToken ct = default)
    {
        var auctions = await _auctionRepository.GetAllAsync(query.IncludeClosed, query.SellerId, ct);

        return auctions.Select(a => new AuctionResponseDto
        {
            Id = a.Id,
            Title = a.Title,
            Description = a.Description,
            StartingPrice = a.StartingPrice,
            CurrentPrice = a.CurrentPrice,
            SellerId = a.SellerId,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            State = a.State,
            ImageUrl = a.ImageUrl
        });
    }
}
