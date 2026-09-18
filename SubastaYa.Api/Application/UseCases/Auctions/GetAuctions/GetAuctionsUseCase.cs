using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.Interfaces.Persistence;

namespace SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;

public class GetAuctionsUseCase
{
    private readonly IAuctionRepository _auctionRepository;

    public GetAuctionsUseCase(IAuctionRepository auctionRepository)
    {
        _auctionRepository = auctionRepository;
    }

    public async Task<IEnumerable<AuctionResponseDto>> ExecuteAsync(bool includeClosed = false, string? sellerId = null, CancellationToken cancellationToken = default)
    {
        var auctions = await _auctionRepository.GetAllAsync(includeClosed, sellerId, cancellationToken);
        
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
            State = a.State
        });
    }
}
