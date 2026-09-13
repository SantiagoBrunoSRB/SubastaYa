using Microsoft.AspNetCore.SignalR;

namespace SubastaYa.Api.Presentation.Hubs;

public class AuctionHub : Hub
{
    private readonly ILogger<AuctionHub> _logger;

    public AuctionHub(ILogger<AuctionHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Une al cliente al grupo de una subasta específica para recibir eventos en tiempo real.
    /// </summary>
    public async Task JoinAuctionGroup(string auctionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Auction_{auctionId}");
        _logger.LogInformation("Cliente {ConnectionId} se unió al grupo de subasta {AuctionId}", Context.ConnectionId, auctionId);
    }

    /// <summary>
    /// Desuscribe al cliente del grupo de una subasta.
    /// </summary>
    public async Task LeaveAuctionGroup(string auctionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Auction_{auctionId}");
        _logger.LogInformation("Cliente {ConnectionId} abandonó el grupo de subasta {AuctionId}", Context.ConnectionId, auctionId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Cliente conectado a AuctionHub: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Cliente desconectado de AuctionHub: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
