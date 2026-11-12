using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs;
using SubastaYa.Api.Application.UseCases.Wallets.Deposit;
using SubastaYa.Api.Application.UseCases.Wallets.GetBalance;
using SubastaYa.Api.Application.UseCases.Wallets.GetTransactions;
using System.Security.Claims;

namespace SubastaYa.Api.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WalletsController : ControllerBase
{
    private readonly IQueryHandler<GetBalanceQuery, WalletBalanceResponseDto> _getBalanceHandler;
    private readonly ICommandHandler<DepositCommand, WalletBalanceResponseDto> _depositHandler;
    private readonly IQueryHandler<GetTransactionsQuery, IEnumerable<TransactionResponseDto>> _getTransactionsHandler;

    public WalletsController(
        IQueryHandler<GetBalanceQuery, WalletBalanceResponseDto> getBalanceHandler,
        ICommandHandler<DepositCommand, WalletBalanceResponseDto> depositHandler,
        IQueryHandler<GetTransactionsQuery, IEnumerable<TransactionResponseDto>> getTransactionsHandler)
    {
        _getBalanceHandler = getBalanceHandler;
        _depositHandler = depositHandler;
        _getTransactionsHandler = getTransactionsHandler;
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

        var query = new GetBalanceQuery(userId);
        var balance = await _getBalanceHandler.HandleAsync(query, ct);
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

        var command = new DepositCommand(userId, request.Amount);
        var result = await _depositHandler.HandleAsync(command, ct);
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

        var query = new GetTransactionsQuery(userId);
        var transactions = await _getTransactionsHandler.HandleAsync(query, ct);
        return Ok(transactions);
    }

    /// <summary>
    /// Re-siembra los datos semilla iniciales en la base de datos (Entorno de desarrollo/testing).
    /// </summary>
    [HttpPost("reseed")]
    [AllowAnonymous]
    public async Task<IActionResult> Reseed([FromServices] IServiceProvider serviceProvider)
    {
        await SubastaYa.Api.Infrastructure.Data.DataSeeder.SeedAsync(serviceProvider);
        return Ok(new { message = "Base de datos re-sembrada exitosamente." });
    }
}
