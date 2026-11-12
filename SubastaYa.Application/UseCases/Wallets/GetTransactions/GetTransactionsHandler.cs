using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;

namespace SubastaYa.Api.Application.UseCases.Wallets.GetTransactions;

/// <summary>
/// Manejador de la consulta GetTransactionsQuery.
/// </summary>
public class GetTransactionsHandler : IQueryHandler<GetTransactionsQuery, IEnumerable<TransactionResponseDto>>
{
    private readonly IWalletService _walletService;

    public GetTransactionsHandler(IWalletService walletService)
    {
        _walletService = walletService;
    }

    public async Task<IEnumerable<TransactionResponseDto>> HandleAsync(GetTransactionsQuery query, CancellationToken ct = default)
    {
        return await _walletService.GetTransactionsAsync(query.UserId, ct);
    }
}
