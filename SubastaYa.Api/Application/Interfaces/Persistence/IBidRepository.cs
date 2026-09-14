using SubastaYa.Api.Domain.Entities;

namespace SubastaYa.Api.Application.Interfaces.Persistence;

public interface IBidRepository
{
    Task AddAsync(Bid bid, CancellationToken cancellationToken = default);
    Task<Bid?> GetHighestBidForAuctionAsync(int auctionId, CancellationToken cancellationToken = default);
}
