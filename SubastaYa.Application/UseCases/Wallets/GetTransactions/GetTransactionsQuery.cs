using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;

namespace SubastaYa.Api.Application.UseCases.Wallets.GetTransactions;

/// <summary>
/// Consulta para obtener el historial contable de movimientos de una billetera.
/// </summary>
public record GetTransactionsQuery(string UserId) : IQuery<IEnumerable<TransactionResponseDto>>;
