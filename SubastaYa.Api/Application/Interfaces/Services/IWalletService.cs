namespace SubastaYa.Api.Application.Interfaces.Services;

public interface IWalletService
{
    Task RetainBidAmountAsync(string userId, decimal amount, CancellationToken cancellationToken = default);
    Task RefundBidAmountAsync(string userId, decimal amount, CancellationToken cancellationToken = default);
}
