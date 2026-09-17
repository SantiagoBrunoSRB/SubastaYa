namespace SubastaYa.Api.Application.DTOs.Bids;

public class BidDto
{
    public int Id { get; set; }
    public string BidderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Timestamp { get; set; }
}
