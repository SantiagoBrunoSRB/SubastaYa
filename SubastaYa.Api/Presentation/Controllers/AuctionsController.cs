using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.DTOs.Bids;
using SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;
using SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;
using SubastaYa.Api.Application.UseCases.Auctions.GetAuctionById;
using SubastaYa.Api.Application.UseCases.Bids.PlaceBid;
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

    public AuctionsController(
        CreateAuctionUseCase createAuctionUseCase,
        GetAuctionsUseCase getAuctionsUseCase,
        GetAuctionByIdUseCase getAuctionByIdUseCase,
        PlaceBidUseCase placeBidUseCase)
    {
        _createAuctionUseCase = createAuctionUseCase;
        _getAuctionsUseCase = getAuctionsUseCase;
        _getAuctionByIdUseCase = getAuctionByIdUseCase;
        _placeBidUseCase = placeBidUseCase;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAuctions(CancellationToken cancellationToken)
    {
        var auctions = await _getAuctionsUseCase.ExecuteAsync(cancellationToken);
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
        
        return CreatedAtAction(nameof(GetAuctions), new { id }, null);
    }

    [HttpPost("{id}/bids")]
    public async Task<IActionResult> PlaceBid(int id, [FromBody] PlaceBidRequestDto request, CancellationToken cancellationToken)
    {
        var bidderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(bidderId)) return Unauthorized();

        await _placeBidUseCase.ExecuteAsync(id, bidderId, request, cancellationToken);
        
        return Ok();
    }
}
