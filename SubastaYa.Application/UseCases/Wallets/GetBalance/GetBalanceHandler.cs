using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;

namespace SubastaYa.Api.Application.UseCases.Wallets.GetBalance;

/// <summary>
/// Manejador de la consulta GetBalanceQuery.
/// </summary>
public class GetBalanceHandler : IQueryHandler<GetBalanceQuery, WalletBalanceResponseDto>
{
    private readonly IWalletService _walletService;

    public GetBalanceHandler(IWalletService walletService)
    {
        _walletService = walletService;
    }

    public async Task<WalletBalanceResponseDto> HandleAsync(GetBalanceQuery query, CancellationToken ct = default)
    {
        return await _walletService.GetBalanceAsync(query.UserId, ct);
    }
}
