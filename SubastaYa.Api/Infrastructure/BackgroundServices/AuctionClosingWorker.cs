using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;
using SubastaYa.Api.Infrastructure.Data;
using SubastaYa.Api.Presentation.Hubs;

namespace SubastaYa.Api.Infrastructure.BackgroundServices;

public class AuctionClosingWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<AuctionHub> _hubContext;
    private readonly ILogger<AuctionClosingWorker> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(10);

    public AuctionClosingWorker(
        IServiceScopeFactory scopeFactory,
        IHubContext<AuctionHub> hubContext,
        ILogger<AuctionClosingWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AuctionClosingWorker iniciado y monitoreando subastas cada {Seconds}s.", _checkInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredAuctionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado durante la ejecución del proceso de cierre de subastas.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("AuctionClosingWorker detenido.");
    }

    private async Task ProcessExpiredAuctionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var walletService = scope.ServiceProvider.GetRequiredService<IWalletService>();

        var now = DateTime.UtcNow;

        // Buscar subastas activas cuya fecha de finalización ya expiró
        var expiredAuctions = await context.Auctions
            .Include(a => a.Bids)
            .Where(a => a.State == AuctionState.Active && a.EndTime <= now)
            .ToListAsync(ct);

        if (!expiredAuctions.Any())
            return;

        _logger.LogInformation("Se encontraron {Count} subastas vencidas para procesar.", expiredAuctions.Count);

        foreach (var auction in expiredAuctions)
        {
            try
            {
                var highestBid = auction.Bids
                    .OrderByDescending(b => b.Amount)
                    .ThenBy(b => b.Timestamp)
                    .FirstOrDefault();

                if (highestBid != null)
                {
                    // Hay un ganador: liquidar fondos del comprador al vendedor
                    _logger.LogInformation(
                        "Liquidando subasta {AuctionId} ({Title}). Ganador: {WinnerId}, Monto: {Amount:C}",
                        auction.Id, auction.Title, highestBid.BidderId, highestBid.Amount);

                    await walletService.SettleAuctionAsync(
                        highestBid.BidderId,
                        auction.SellerId,
                        highestBid.Amount,
                        auction.Id,
                        ct);

                    auction.State = AuctionState.Closed;
                    auction.CurrentPrice = highestBid.Amount;

                    // Registro de auditoría
                    context.AuditLogs.Add(new AuditLog
                    {
                        Action = "AuctionClosed_WithWinner",
                        UserId = highestBid.BidderId,
                        Details = JsonSerializer.Serialize(new
                        {
                            AuctionId = auction.Id,
                            Title = auction.Title,
                            SellerId = auction.SellerId,
                            WinnerId = highestBid.BidderId,
                            FinalPrice = highestBid.Amount,
                            ClosedAt = now
                        }),
                        Timestamp = now
                    });

                    // Notificación en tiempo real vía SignalR
                    await _hubContext.Clients.Group($"Auction_{auction.Id}").SendAsync("AuctionClosed", new
                    {
                        AuctionId = auction.Id,
                        Title = auction.Title,
                        WinnerId = highestBid.BidderId,
                        FinalPrice = highestBid.Amount,
                        State = "Closed"
                    }, ct);

                    await _hubContext.Clients.All.SendAsync("AuctionClosed", new
                    {
                        AuctionId = auction.Id,
                        Title = auction.Title,
                        WinnerId = highestBid.BidderId,
                        FinalPrice = highestBid.Amount,
                        State = "Closed"
                    }, ct);
                }
                else
                {
                    // No hubo pujas: cerrar la subasta sin liquidación
                    _logger.LogInformation("Cerrando subasta {AuctionId} ({Title}) sin pujas registradas.", auction.Id, auction.Title);
                    auction.State = AuctionState.Closed;

                    context.AuditLogs.Add(new AuditLog
                    {
                        Action = "AuctionClosed_NoBids",
                        UserId = auction.SellerId,
                        Details = JsonSerializer.Serialize(new
                        {
                            AuctionId = auction.Id,
                            Title = auction.Title,
                            SellerId = auction.SellerId,
                            StartingPrice = auction.StartingPrice,
                            ClosedAt = now
                        }),
                        Timestamp = now
                    });

                    await _hubContext.Clients.Group($"Auction_{auction.Id}").SendAsync("AuctionClosed", new
                    {
                        AuctionId = auction.Id,
                        Title = auction.Title,
                        WinnerId = (string?)null,
                        FinalPrice = auction.StartingPrice,
                        State = "Closed"
                    }, ct);
                }

                await context.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar el cierre de la subasta {AuctionId}", auction.Id);
            }
        }
    }
}
