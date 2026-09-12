namespace SubastaYa.Api.Domain.Entities;

public class Bid
{
    public int Id { get; set; }
    
    public int AuctionId { get; set; }
    public Auction? Auction { get; set; }

    public string BidderId { get; set; } = string.Empty; // Relacion con IdentityUser
    
    public decimal Amount { get; set; }
    public DateTime Timestamp { get; set; }
}
