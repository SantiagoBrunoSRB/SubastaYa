using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Infrastructure.Data;

namespace SubastaYa.Api.Infrastructure.Repositories;

public class AuctionRepository : IAuctionRepository
{
    private readonly AppDbContext _context;

    public AuctionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Auction?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Auctions
            .Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Auction>> GetAllActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Auctions
            .Where(a => a.State == Domain.Enums.AuctionState.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Auction auction, CancellationToken cancellationToken = default)
    {
        await _context.Auctions.AddAsync(auction, cancellationToken);
    }

    public Task UpdateAsync(Auction auction, CancellationToken cancellationToken = default)
    {
        _context.Auctions.Update(auction);
        return Task.CompletedTask;
    }
}
