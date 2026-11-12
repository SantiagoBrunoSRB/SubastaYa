using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;

namespace SubastaYa.Api.Application.UseCases.Wallets.Deposit;

/// <summary>
/// Manejador del comando DepositCommand para depósitos en billeteras.
/// </summary>
public class DepositHandler : ICommandHandler<DepositCommand, WalletBalanceResponseDto>
{
    private readonly IWalletService _walletService;

    public DepositHandler(IWalletService walletService)
    {
        _walletService = walletService;
    }

    public async Task<WalletBalanceResponseDto> HandleAsync(DepositCommand command, CancellationToken ct = default)
    {
        return await _walletService.DepositAsync(command.UserId, command.Amount, ct);
    }
}
