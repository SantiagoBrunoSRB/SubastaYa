using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;
using SubastaYa.Api.Domain.Exceptions;

namespace SubastaYa.Api.Application.Services;

public class WalletService : IWalletService
{
    private readonly IWalletRepository _walletRepository;

    public WalletService(IWalletRepository walletRepository)
    {
        _walletRepository = walletRepository;
    }

    private async Task<Wallet> GetOrCreateWalletAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("El identificador de usuario no puede ser nulo o vacío.", nameof(userId));

        var wallet = await _walletRepository.GetByUserIdAsync(userId, ct);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                UserId = userId,
                TotalBalance = 0,
                RetainedBalance = 0
            };
            await _walletRepository.AddAsync(wallet, ct);
            await _walletRepository.SaveChangesAsync(ct);
        }

        return wallet;
    }

    public async Task<WalletBalanceResponseDto> GetBalanceAsync(string userId, CancellationToken ct = default)
    {
        var wallet = await GetOrCreateWalletAsync(userId, ct);
        return new WalletBalanceResponseDto(
            wallet.UserId,
            wallet.TotalBalance,
            wallet.RetainedBalance,
            wallet.AvailableBalance
        );
    }

    public async Task<bool> HasSufficientBalanceAsync(string userId, decimal amount, CancellationToken ct = default)
    {
        if (amount <= 0) return false;
        var wallet = await _walletRepository.GetByUserIdAsync(userId, ct);
        if (wallet == null) return false;
        return wallet.AvailableBalance >= amount;
    }

    public async Task<WalletBalanceResponseDto> DepositAsync(string userId, decimal amount, CancellationToken ct = default)
    {
        if (amount <= 0)
            throw new InvalidAmountException(amount, "El monto a depositar debe ser mayor a cero.");

        var wallet = await GetOrCreateWalletAsync(userId, ct);

        wallet.TotalBalance += amount;
        _walletRepository.Update(wallet);

        var ledger = new TransactionLedger
        {
            WalletId = wallet.Id,
            Type = TransactionType.Deposit,
            Amount = amount,
            CreatedAt = DateTime.UtcNow
        };
        await _walletRepository.AddTransactionAsync(ledger, ct);
        await _walletRepository.SaveChangesAsync(ct);

        return new WalletBalanceResponseDto(
            wallet.UserId,
            wallet.TotalBalance,
            wallet.RetainedBalance,
            wallet.AvailableBalance
        );
    }

    public async Task HoldFundsAsync(string userId, decimal amount, int? auctionId = null, CancellationToken ct = default)
    {
        if (amount <= 0)
            throw new InvalidAmountException(amount, "El monto a retener debe ser mayor a cero.");

        var wallet = await _walletRepository.GetByUserIdAsync(userId, ct)
            ?? throw new WalletNotFoundException($"No se encontró la billetera del usuario '{userId}'.");

        if (wallet.AvailableBalance < amount)
            throw new InsufficientFundsException(wallet.AvailableBalance, amount);

        wallet.RetainedBalance += amount;
        _walletRepository.Update(wallet);

        var ledger = new TransactionLedger
        {
            WalletId = wallet.Id,
            Type = TransactionType.Hold,
            Amount = amount,
            AuctionId = auctionId,
            CreatedAt = DateTime.UtcNow
        };
        await _walletRepository.AddTransactionAsync(ledger, ct);
        await _walletRepository.SaveChangesAsync(ct);
    }

    public async Task ReleaseFundsAsync(string userId, decimal amount, int? auctionId = null, CancellationToken ct = default)
    {
        if (amount <= 0)
            throw new InvalidAmountException(amount, "El monto a liberar debe ser mayor a cero.");

        var wallet = await _walletRepository.GetByUserIdAsync(userId, ct)
            ?? throw new WalletNotFoundException($"No se encontró la billetera del usuario '{userId}'.");

        if (wallet.RetainedBalance < amount)
            wallet.RetainedBalance = 0;
        else
            wallet.RetainedBalance -= amount;

        _walletRepository.Update(wallet);

        var ledger = new TransactionLedger
        {
            WalletId = wallet.Id,
            Type = TransactionType.Release,
            Amount = amount,
            AuctionId = auctionId,
            CreatedAt = DateTime.UtcNow
        };
        await _walletRepository.AddTransactionAsync(ledger, ct);
        await _walletRepository.SaveChangesAsync(ct);
    }

    public async Task ReplaceHoldAsync(
        string? previousBidderId,
        decimal? previousAmount,
        string newBidderId,
        decimal newAmount,
        int auctionId,
        CancellationToken ct = default)
    {
        using var tx = await _walletRepository.BeginTransactionAsync(ct);
        try
        {
            // 1. Liberar fondos del postor anterior si aplica
            if (!string.IsNullOrWhiteSpace(previousBidderId) && previousAmount.HasValue && previousAmount.Value > 0)
            {
                var prevWallet = await _walletRepository.GetByUserIdAsync(previousBidderId, ct);
                if (prevWallet != null)
                {
                    if (prevWallet.RetainedBalance < previousAmount.Value)
                        prevWallet.RetainedBalance = 0;
                    else
                        prevWallet.RetainedBalance -= previousAmount.Value;

                    _walletRepository.Update(prevWallet);

                    await _walletRepository.AddTransactionAsync(new TransactionLedger
                    {
                        WalletId = prevWallet.Id,
                        Type = TransactionType.Release,
                        Amount = previousAmount.Value,
                        AuctionId = auctionId,
                        CreatedAt = DateTime.UtcNow
                    }, ct);
                }
            }

            // 2. Retener fondos del nuevo postor
            if (newAmount <= 0)
                throw new InvalidAmountException(newAmount, "El monto de la puja debe ser mayor a cero.");

            var newWallet = await _walletRepository.GetByUserIdAsync(newBidderId, ct)
                ?? throw new WalletNotFoundException($"No se encontró la billetera del usuario postor '{newBidderId}'.");

            if (newWallet.AvailableBalance < newAmount)
                throw new InsufficientFundsException(newWallet.AvailableBalance, newAmount);

            newWallet.RetainedBalance += newAmount;
            _walletRepository.Update(newWallet);

            await _walletRepository.AddTransactionAsync(new TransactionLedger
            {
                WalletId = newWallet.Id,
                Type = TransactionType.Hold,
                Amount = newAmount,
                AuctionId = auctionId,
                CreatedAt = DateTime.UtcNow
            }, ct);

            await _walletRepository.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task SettleAuctionAsync(string buyerId, string sellerId, decimal amount, int auctionId, CancellationToken ct = default)
    {
        if (amount <= 0)
            throw new InvalidAmountException(amount, "El monto a liquidar debe ser mayor a cero.");

        using var tx = await _walletRepository.BeginTransactionAsync(ct);
        try
        {
            // 1. Comprador (ganador): se debita el saldo retenido y el total
            var buyerWallet = await _walletRepository.GetByUserIdAsync(buyerId, ct)
                ?? throw new WalletNotFoundException($"Billetera del comprador '{buyerId}' no encontrada.");

            if (buyerWallet.RetainedBalance >= amount)
                buyerWallet.RetainedBalance -= amount;
            else
                buyerWallet.RetainedBalance = 0;

            buyerWallet.TotalBalance -= amount;
            _walletRepository.Update(buyerWallet);

            await _walletRepository.AddTransactionAsync(new TransactionLedger
            {
                WalletId = buyerWallet.Id,
                Type = TransactionType.Debit,
                Amount = amount,
                AuctionId = auctionId,
                CreatedAt = DateTime.UtcNow
            }, ct);

            // 2. Vendedor: se le acredita el dinero al saldo total
            var sellerWallet = await GetOrCreateWalletAsync(sellerId, ct);
            sellerWallet.TotalBalance += amount;
            _walletRepository.Update(sellerWallet);

            await _walletRepository.AddTransactionAsync(new TransactionLedger
            {
                WalletId = sellerWallet.Id,
                Type = TransactionType.Credit,
                Amount = amount,
                AuctionId = auctionId,
                CreatedAt = DateTime.UtcNow
            }, ct);

            await _walletRepository.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IEnumerable<TransactionResponseDto>> GetTransactionsAsync(string userId, CancellationToken ct = default)
    {
        var wallet = await _walletRepository.GetByUserIdAsync(userId, ct);
        if (wallet == null)
            return Enumerable.Empty<TransactionResponseDto>();

        var transactions = await _walletRepository.GetTransactionsByWalletIdAsync(wallet.Id, ct);
        return transactions.Select(t => new TransactionResponseDto(
            t.Id,
            t.WalletId,
            t.Type.ToString(),
            t.Amount,
            t.CreatedAt,
            t.AuctionId
        ));
    }
}
