using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;

namespace SubastaYa.Api.Application.UseCases.Wallets.GetBalance;

/// <summary>
/// Consulta para obtener el desglose del saldo de la billetera de un usuario.
/// </summary>
public record GetBalanceQuery(string UserId) : IQuery<WalletBalanceResponseDto>;
