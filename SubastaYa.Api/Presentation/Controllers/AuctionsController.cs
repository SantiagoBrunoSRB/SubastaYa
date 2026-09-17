using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Application.DTOs.Auctions;
using SubastaYa.Api.Application.DTOs.Bids;
using SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;
using SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;
using SubastaYa.Api.Application.UseCases.Bids.PlaceBid;

namespace SubastaYa.Api.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/auctions")]
public class AuctionsController : ControllerBase
{
    private readonly CreateAuctionUseCase _createAuctionUseCase;
    private readonly GetAuctionsUseCase _getAuctionsUseCase;
    private readonly PlaceBidUseCase _placeBidUseCase;

    public AuctionsController(
        CreateAuctionUseCase createAuctionUseCase,
        GetAuctionsUseCase getAuctionsUseCase,
        PlaceBidUseCase placeBidUseCase)
    {
        _createAuctionUseCase = createAuctionUseCase;
        _getAuctionsUseCase = getAuctionsUseCase;
        _placeBidUseCase = placeBidUseCase;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuctions(CancellationToken cancellationToken)
    {
        var auctions = await _getAuctionsUseCase.ExecuteAsync(cancellationToken);
        return Ok(auctions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAuction([FromBody] CreateAuctionRequestDto request, CancellationToken cancellationToken)
    {
        // TODO: Reemplazar por Auth User real cuando se implemente Identity
        var sellerId = "SELLER_ID_FIJO";
        var id = await _createAuctionUseCase.ExecuteAsync(request, sellerId, cancellationToken);
        
        return CreatedAtAction(nameof(GetAuctions), new { id }, null);
    }

    [HttpPost("{id}/bids")]
    public async Task<IActionResult> PlaceBid(int id, [FromBody] PlaceBidRequestDto request, CancellationToken cancellationToken)
    {
        // TODO: Reemplazar por Auth User real cuando se implemente Identity
        var bidderId = "BIDDER_ID_FIJO";
        await _placeBidUseCase.ExecuteAsync(id, bidderId, request, cancellationToken);
        
        return Ok();
    }
}
