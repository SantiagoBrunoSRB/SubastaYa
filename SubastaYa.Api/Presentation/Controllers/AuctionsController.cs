using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.DTOs.Bids;
using SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;
using SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;
using SubastaYa.Api.Application.UseCases.Auctions.GetAuctionById;
using SubastaYa.Api.Application.UseCases.Bids.PlaceBid;
using SubastaYa.Api.Presentation.Hubs;
using System.Security.Claims;

namespace SubastaYa.Api.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/auctions")]
public class AuctionsController : ControllerBase
{
    private readonly ICommandHandler<CreateAuctionCommand, int> _createAuctionHandler;
    private readonly IQueryHandler<GetAuctionsQuery, IEnumerable<AuctionResponseDto>> _getAuctionsHandler;
    private readonly IQueryHandler<GetAuctionByIdQuery, AuctionDetailResponseDto> _getAuctionByIdHandler;
    private readonly ICommandHandler<PlaceBidCommand> _placeBidHandler;
    private readonly IHubContext<AuctionHub> _hubContext;

    public AuctionsController(
        ICommandHandler<CreateAuctionCommand, int> createAuctionHandler,
        IQueryHandler<GetAuctionsQuery, IEnumerable<AuctionResponseDto>> getAuctionsHandler,
        IQueryHandler<GetAuctionByIdQuery, AuctionDetailResponseDto> getAuctionByIdHandler,
        ICommandHandler<PlaceBidCommand> placeBidHandler,
        IHubContext<AuctionHub> hubContext)
    {
        _createAuctionHandler = createAuctionHandler;
        _getAuctionsHandler = getAuctionsHandler;
        _getAuctionByIdHandler = getAuctionByIdHandler;
        _placeBidHandler = placeBidHandler;
        _hubContext = hubContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAuctions(
        [FromQuery] bool includeClosed = false,
        [FromQuery] string? sellerId = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAuctionsQuery(includeClosed, sellerId);
        var auctions = await _getAuctionsHandler.HandleAsync(query, cancellationToken);
        return Ok(auctions);
    }

    [HttpGet("my-publications")]
    public async Task<IActionResult> GetMyPublications(CancellationToken cancellationToken = default)
    {
        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized();

        var query = new GetAuctionsQuery(IncludeClosed: true, SellerId: sellerId);
        var auctions = await _getAuctionsHandler.HandleAsync(query, cancellationToken);
        return Ok(auctions);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuctionDetailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuction(int id, CancellationToken cancellationToken)
    {
        var query = new GetAuctionByIdQuery(id);
        var auction = await _getAuctionByIdHandler.HandleAsync(query, cancellationToken);
        return Ok(auction);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAuction(
        [FromBody] CreateAuctionRequestDto request,
        CancellationToken cancellationToken)
    {
        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized();

        var command = new CreateAuctionCommand(request, sellerId);
        var id = await _createAuctionHandler.HandleAsync(command, cancellationToken);

        return CreatedAtAction(nameof(GetAuctions), new { id }, new { id });
    }

    [HttpPost("{id}/bids")]
    public async Task<IActionResult> PlaceBid(
        int id,
        [FromBody] PlaceBidRequestDto request,
        CancellationToken cancellationToken)
    {
        var bidderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(bidderId)) return Unauthorized();

        var command = new PlaceBidCommand(id, bidderId, request.Amount);
        await _placeBidHandler.HandleAsync(command, cancellationToken);

        // Notificar a los suscriptores de la sala en tiempo real vía SignalR
        await _hubContext.Clients.Group($"Auction_{id}").SendAsync("ReceiveBid", new
        {
            auctionId = id,
            bidderId = bidderId,
            amount = request.Amount,
            timestamp = DateTime.UtcNow
        }, cancellationToken);

        return Ok(new { success = true, amount = request.Amount });
    }
}
