using SubastaYa.Api.Domain.Enums;

namespace SubastaYa.Api.Application.DTOs.Auctions;

public class AuctionResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal StartingPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    public string SellerId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public AuctionState State { get; set; }
}
