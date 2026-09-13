using SubastaYa.Api.Domain.Enums;

namespace SubastaYa.Api.Domain.Entities;

public class TransactionLedger
{
    public int Id { get; set; }
    public int WalletId { get; set; }
    public Wallet? Wallet { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? AuctionId { get; set; }
    public Auction? Auction { get; set; }
}
