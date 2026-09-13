using Microsoft.EntityFrameworkCore.Storage;
using SubastaYa.Api.Domain.Entities;

namespace SubastaYa.Api.Application.Interfaces;

public interface IWalletRepository
{
    Task<Wallet?> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<Wallet?> GetByIdAsync(int walletId, CancellationToken ct = default);
    Task AddAsync(Wallet wallet, CancellationToken ct = default);
    void Update(Wallet wallet);
    Task AddTransactionAsync(TransactionLedger transaction, CancellationToken ct = default);
    Task<IEnumerable<TransactionLedger>> GetTransactionsByWalletIdAsync(int walletId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default);
}
