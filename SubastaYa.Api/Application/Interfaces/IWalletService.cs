using SubastaYa.Api.Application.DTOs;

namespace SubastaYa.Api.Application.Interfaces;

/// <summary>
/// Contrato de servicios de billetera para operaciones de saldo, depósitos y gestión de retenciones (Escrow).
/// </summary>
public interface IWalletService
{
    /// <summary>
    /// Obtiene el saldo (total, retenido y disponible) de un usuario. Si no existe, inicializa su billetera.
    /// </summary>
    Task<WalletBalanceResponseDto> GetBalanceAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Comprueba si el usuario cuenta con saldo disponible suficiente para una operación.
    /// </summary>
    Task<bool> HasSufficientBalanceAsync(string userId, decimal amount, CancellationToken ct = default);

    /// <summary>
    /// Retiene fondos de la billetera (Escrow) al realizar una puja.
    /// </summary>
    Task HoldFundsAsync(string userId, decimal amount, int? auctionId = null, CancellationToken ct = default);

    /// <summary>
    /// Libera fondos previamente retenidos cuando una puja es superada.
    /// </summary>
    Task ReleaseFundsAsync(string userId, decimal amount, int? auctionId = null, CancellationToken ct = default);

    /// <summary>
    /// Ejecuta de forma atómica la liberación de saldo del postor anterior y la retención del nuevo postor.
    /// </summary>
    Task ReplaceHoldAsync(string? previousBidderId, decimal? previousAmount, string newBidderId, decimal newAmount, int auctionId, CancellationToken ct = default);

    /// <summary>
    /// Acredita dinero en la billetera del usuario y genera el registro contable correspondiente.
    /// </summary>
    Task<WalletBalanceResponseDto> DepositAsync(string userId, decimal amount, CancellationToken ct = default);

    /// <summary>
    /// Liquida la subasta al finalizar: debita los fondos del comprador ganador y los transfiere al vendedor.
    /// </summary>
    Task SettleAuctionAsync(string buyerId, string sellerId, decimal amount, int auctionId, CancellationToken ct = default);

    /// <summary>
    /// Retorna el historial cronológico de transacciones asociadas a la billetera del usuario.
    /// </summary>
    Task<IEnumerable<TransactionResponseDto>> GetTransactionsAsync(string userId, CancellationToken ct = default);
}
