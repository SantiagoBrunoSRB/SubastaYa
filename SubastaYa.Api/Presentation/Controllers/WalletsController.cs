using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Domain.Exceptions;

namespace SubastaYa.Api.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WalletsController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly ILogger<WalletsController> _logger;

    public WalletsController(IWalletService walletService, ILogger<WalletsController> logger)
    {
        _walletService = walletService;
        _logger = logger;
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

        if (request.Amount <= 0)
            return BadRequest(new { message = "El monto a depositar debe ser mayor a 0." });

        try
        {
            var result = await _walletService.DepositAsync(userId, request.Amount, ct);
            return Ok(result);
        }
        catch (InvalidAmountException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al depositar fondos para el usuario {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Ocurrió un error al procesar el depósito." });
        }
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
