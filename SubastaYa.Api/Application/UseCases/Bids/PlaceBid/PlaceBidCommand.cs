using SubastaYa.Api.Application.CQRS;

namespace SubastaYa.Api.Application.UseCases.Bids.PlaceBid;

/// <summary>Comando para realizar una puja en una subasta.</summary>
public record PlaceBidCommand(int AuctionId, string BidderId, decimal Amount) : ICommand;
