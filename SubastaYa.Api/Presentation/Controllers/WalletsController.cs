using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;
using System.Security.Claims;

namespace SubastaYa.Api.Presentation.Controllers;

[Authorize]
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
    [HttpGet("balance")]
    [ProducesResponseType(typeof(WalletBalanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetBalance(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(new { message = "Usuario no autenticado." });

        var balance = await _walletService.GetBalanceAsync(userId, ct);
        return Ok(balance);
    }

    /// <summary>
    /// Realiza un depósito de dinero en la billetera de un usuario.
    /// Excepciones como InvalidAmountException son interceptadas por el GlobalExceptionMiddleware.
    /// </summary>
    [HttpPost("deposit")]
    [ProducesResponseType(typeof(WalletBalanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Deposit([FromBody] DepositRequestDto request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(new { message = "Usuario no autenticado." });

        if (request == null)
            return BadRequest(new { message = "El cuerpo de la solicitud no puede estar vacío." });

        var result = await _walletService.DepositAsync(userId, request.Amount, ct);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el historial de transacciones de un usuario.
    /// </summary>
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IEnumerable<TransactionResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTransactions(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(new { message = "Usuario no autenticado." });

        var transactions = await _walletService.GetTransactionsAsync(userId, ct);
        return Ok(transactions);
    }
}
