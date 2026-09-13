using SubastaYa.Api.Application.DTOs;

namespace SubastaYa.Api.Application.Interfaces;

public interface IWalletService
{
    Task<WalletBalanceResponseDto> GetBalanceAsync(string userId, CancellationToken ct = default);
    Task<bool> HasSufficientBalanceAsync(string userId, decimal amount, CancellationToken ct = default);
    Task HoldFundsAsync(string userId, decimal amount, int? auctionId = null, CancellationToken ct = default);
    Task ReleaseFundsAsync(string userId, decimal amount, int? auctionId = null, CancellationToken ct = default);
    Task ReplaceHoldAsync(string? previousBidderId, decimal? previousAmount, string newBidderId, decimal newAmount, int auctionId, CancellationToken ct = default);
    Task<WalletBalanceResponseDto> DepositAsync(string userId, decimal amount, CancellationToken ct = default);
    Task SettleAuctionAsync(string buyerId, string sellerId, decimal amount, int auctionId, CancellationToken ct = default);
    Task<IEnumerable<TransactionResponseDto>> GetTransactionsAsync(string userId, CancellationToken ct = default);
}
