using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;

namespace SubastaYa.Api.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WalletsController : ControllerBase
{
    private readonly IWalletService _walletService;

    public WalletsController(IWalletService walletService)
    {
        _walletService = walletService;
    }

    /// <summary>
    /// Consulta el saldo (total, retenido y disponible) de la billetera de un usuario.
    /// </summary>
    [HttpGet("{userId}/balance")]
    [ProducesResponseType(typeof(WalletBalanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetBalance(string userId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { message = "El userId es requerido." });

        var balance = await _walletService.GetBalanceAsync(userId, ct);
        return Ok(balance);
    }

    /// <summary>
    /// Realiza un depósito de dinero en la billetera de un usuario.
    /// Excepciones como InvalidAmountException son interceptadas por el GlobalExceptionMiddleware.
    /// </summary>
    [HttpPost("{userId}/deposit")]
    [ProducesResponseType(typeof(WalletBalanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Deposit(string userId, [FromBody] DepositRequestDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { message = "El userId es requerido." });

        if (request == null)
            return BadRequest(new { message = "El cuerpo de la solicitud no puede estar vacío." });

        var result = await _walletService.DepositAsync(userId, request.Amount, ct);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el historial de transacciones de un usuario.
    /// </summary>
    [HttpGet("{userId}/transactions")]
    [ProducesResponseType(typeof(IEnumerable<TransactionResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTransactions(string userId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { message = "El userId es requerido." });

        var transactions = await _walletService.GetTransactionsAsync(userId, ct);
        return Ok(transactions);
    }
}
