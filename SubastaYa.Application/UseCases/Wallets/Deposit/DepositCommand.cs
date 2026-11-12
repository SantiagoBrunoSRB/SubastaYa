using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;

namespace SubastaYa.Api.Application.UseCases.Wallets.Deposit;

/// <summary>
/// Comando para acreditar dinero en la billetera de un usuario.
/// </summary>
public record DepositCommand(string UserId, decimal Amount) : ICommand<WalletBalanceResponseDto>;
