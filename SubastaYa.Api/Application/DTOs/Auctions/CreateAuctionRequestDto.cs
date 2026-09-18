using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Api.Application.DTOs.Auctions;

public class CreateAuctionRequestDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    [Required]
    public string Description { get; set; } = string.Empty;
    [Range(0.01, double.MaxValue)]
    public decimal StartingPrice { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? ImageUrl { get; set; }
}
