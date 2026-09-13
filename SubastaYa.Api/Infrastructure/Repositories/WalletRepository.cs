using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Infrastructure.Data;

namespace SubastaYa.Api.Infrastructure.Repositories;

public class WalletRepository : IWalletRepository
{
    private readonly AppDbContext _context;

    public WalletRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Wallet?> GetByUserIdAsync(string userId, CancellationToken ct = default)
    {
        return await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId, ct);
    }

    public async Task<Wallet?> GetByIdAsync(int walletId, CancellationToken ct = default)
    {
        return await _context.Wallets
            .FirstOrDefaultAsync(w => w.Id == walletId, ct);
    }

    public async Task AddAsync(Wallet wallet, CancellationToken ct = default)
    {
        await _context.Wallets.AddAsync(wallet, ct);
    }

    public void Update(Wallet wallet)
    {
        _context.Wallets.Update(wallet);
    }

    public async Task AddTransactionAsync(TransactionLedger transaction, CancellationToken ct = default)
    {
        await _context.TransactionLedgers.AddAsync(transaction, ct);
    }

    public async Task<IEnumerable<TransactionLedger>> GetTransactionsByWalletIdAsync(int walletId, CancellationToken ct = default)
    {
        return await _context.TransactionLedgers
            .Where(t => t.WalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default)
    {
        return await _context.Database.BeginTransactionAsync(ct);
    }
}
