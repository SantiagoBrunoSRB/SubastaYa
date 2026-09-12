using System.ComponentModel.DataAnnotations;
using SubastaYa.Api.Domain.Enums;

namespace SubastaYa.Api.Domain.Entities;

public class Auction
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal StartingPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    
    public string SellerId { get; set; } = string.Empty; // Relacion con IdentityUser
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public AuctionState State { get; set; } = AuctionState.Active;
    
    // Concurrencia Optimista (Para evitar que 2 personas pujen a la vez y haya inconsistencias)
    [Timestamp]
    public byte[] Version { get; set; } = Array.Empty<byte>();

    // Navegacion
    public ICollection<Bid> Bids { get; set; } = new List<Bid>();
}
