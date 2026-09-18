using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
    private readonly CreateAuctionUseCase _createAuctionUseCase;
    private readonly GetAuctionsUseCase _getAuctionsUseCase;
    private readonly GetAuctionByIdUseCase _getAuctionByIdUseCase;
    private readonly PlaceBidUseCase _placeBidUseCase;
    private readonly IHubContext<AuctionHub> _hubContext;

    public AuctionsController(
        CreateAuctionUseCase createAuctionUseCase,
        GetAuctionsUseCase getAuctionsUseCase,
        GetAuctionByIdUseCase getAuctionByIdUseCase,
        PlaceBidUseCase placeBidUseCase,
        IHubContext<AuctionHub> hubContext)
    {
        _createAuctionUseCase = createAuctionUseCase;
        _getAuctionsUseCase = getAuctionsUseCase;
        _getAuctionByIdUseCase = getAuctionByIdUseCase;
        _placeBidUseCase = placeBidUseCase;
        _hubContext = hubContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAuctions([FromQuery] bool includeClosed = false, [FromQuery] string? sellerId = null, CancellationToken cancellationToken = default)
    {
        var auctions = await _getAuctionsUseCase.ExecuteAsync(includeClosed, sellerId, cancellationToken);
        return Ok(auctions);
    }

    [HttpGet("my-publications")]
    public async Task<IActionResult> GetMyPublications(CancellationToken cancellationToken = default)
    {
        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized();

        var auctions = await _getAuctionsUseCase.ExecuteAsync(includeClosed: true, sellerId: sellerId, cancellationToken: cancellationToken);
        return Ok(auctions);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuctionDetailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuction(int id, CancellationToken cancellationToken)
    {
        var auction = await _getAuctionByIdUseCase.ExecuteAsync(id, cancellationToken);
        return Ok(auction);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAuction([FromBody] CreateAuctionRequestDto request, CancellationToken cancellationToken)
    {
        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sellerId)) return Unauthorized();

        var id = await _createAuctionUseCase.ExecuteAsync(request, sellerId, cancellationToken);
        
        return CreatedAtAction(nameof(GetAuctions), new { id }, new { id });
    }

    [HttpPost("{id}/bids")]
    public async Task<IActionResult> PlaceBid(int id, [FromBody] PlaceBidRequestDto request, CancellationToken cancellationToken)
    {
        var bidderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(bidderId)) return Unauthorized();

        await _placeBidUseCase.ExecuteAsync(id, bidderId, request, cancellationToken);

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
