using SubastaYa.Api.Domain.Entities;

namespace SubastaYa.Api.Application.Interfaces.Persistence;

public interface IAuctionRepository
{
    Task<Auction?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Auction>> GetAllActiveAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Auction>> GetAllAsync(bool includeClosed = false, string? sellerId = null, CancellationToken cancellationToken = default);
    Task AddAsync(Auction auction, CancellationToken cancellationToken = default);
    Task UpdateAsync(Auction auction, CancellationToken cancellationToken = default);
}
