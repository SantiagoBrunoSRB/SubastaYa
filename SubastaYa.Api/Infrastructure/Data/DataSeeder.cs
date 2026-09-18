using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;
using System.Security.Claims;

namespace SubastaYa.Api.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var context = serviceProvider.GetRequiredService<AppDbContext>();

        await context.Database.EnsureCreatedAsync();

        // 1. Usuarios a crear / sincronizar
        var usersToSeed = new[]
        {
            new { Email = "vendedor@test.com", InitialDeposit = 0m, Held = 0m },
            new { Email = "comprador1@test.com", InitialDeposit = 150000m, Held = 45000m },
            new { Email = "comprador2@test.com", InitialDeposit = 200000m, Held = 0m },
            new { Email = "sinfondos@test.com", InitialDeposit = 500m, Held = 0m }
        };

        var userIds = new Dictionary<string, string>();

        // 2. Crear/Sincronizar usuarios y billeteras con los valores exactos requeridos
        foreach (var u in usersToSeed)
        {
            var user = await userManager.FindByEmailAsync(u.Email);
            if (user == null)
            {
                user = new IdentityUser { UserName = u.Email, Email = u.Email, EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, "Password123!");
                if (!result.Succeeded)
                {
                    continue;
                }
            }
            userIds[u.Email] = user.Id;

            var wallet = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == user.Id);
            if (wallet == null)
            {
                wallet = new Wallet
                {
                    UserId = user.Id,
                    TotalBalance = u.InitialDeposit,
                    HeldBalance = u.Held
                };
                context.Wallets.Add(wallet);
            }
            else
            {
                wallet.TotalBalance = u.InitialDeposit;
                wallet.HeldBalance = u.Held;
            }

            await context.SaveChangesAsync();

            if (u.InitialDeposit > 0 && !await context.TransactionLedgers.AnyAsync(t => t.WalletId == wallet.Id && t.Type == TransactionType.Deposit))
            {
                context.TransactionLedgers.Add(new TransactionLedger
                {
                    WalletId = wallet.Id,
                    Type = TransactionType.Deposit,
                    Amount = u.InitialDeposit,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                });
            }
        }

        await context.SaveChangesAsync();

        // 3. Crear Subastas de Prueba si faltan
        var sellerId = userIds["vendedor@test.com"];
        var comprador1Id = userIds["comprador1@test.com"];

        if (await context.Auctions.CountAsync() < 5)
        {
            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("PlayStation") || a.Title.Contains("Laptop")))
            {
                var auction1 = new Auction
                {
                    Title = "Laptop Gamer Pro RTX 4080 (Tecnología)",
                    Description = "Laptop de alta gama con 32GB RAM y pantalla OLED 240Hz.",
                    Category = "Tecnología",
                    StartingPrice = 30000m,
                    CurrentPrice = 45000m, // Comprador 1 lidera
                    SellerId = sellerId,
                    StartTime = DateTime.UtcNow.AddMinutes(-30),
                    EndTime = DateTime.UtcNow.AddHours(2),
                    State = AuctionState.Active,
                    ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80"
                };
                context.Auctions.Add(auction1);
            }

            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("Rolex") || a.Title.Contains("Smartphone")))
            {
                context.Auctions.Add(new Auction
                {
                    Title = "Smartphone Flagship OLED (Tecnología)",
                    Description = "Teléfono móvil con cámara de 200MP y carga ultrarrápida.",
                    Category = "Coleccionables",
                    StartingPrice = 15000m,
                    CurrentPrice = 15000m,
                    SellerId = sellerId,
                    StartTime = DateTime.UtcNow.AddMinutes(-10),
                    EndTime = DateTime.UtcNow.AddSeconds(45), // Activa crítica (< 60s)
                    State = AuctionState.Active,
                    ImageUrl = "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80"
                });
            }

            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("Messi")))
            {
                context.Auctions.Add(new Auction
                {
                    Title = "Camiseta Messi Firmada",
                    Description = "Edición mundial Qatar.",
                    Category = "Indumentaria",
                    StartingPrice = 50000m,
                    CurrentPrice = 50000m,
                    SellerId = sellerId,
                    StartTime = DateTime.UtcNow.AddHours(24),
                    EndTime = DateTime.UtcNow.AddHours(48), // Próxima
                    State = AuctionState.Active,
                    ImageUrl = "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80"
                });
            }

            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("Fiesta")))
            {
                context.Auctions.Add(new Auction
                {
                    Title = "Auto Ford Fiesta",
                    Description = "Buen estado.",
                    Category = "Vehículos",
                    StartingPrice = 200000m,
                    CurrentPrice = 250000m,
                    SellerId = sellerId,
                    StartTime = DateTime.UtcNow.AddDays(-2),
                    EndTime = DateTime.UtcNow.AddDays(-1), // Vencida
                    State = AuctionState.Closed,
                    ImageUrl = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
                });
            }

            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("Cuadro")))
            {
                context.Auctions.Add(new Auction
                {
                    Title = "Cuadro Abstracto",
                    Description = "Pintura al óleo.",
                    Category = "Arte",
                    StartingPrice = 5000m,
                    CurrentPrice = 5000m,
                    SellerId = sellerId,
                    StartTime = DateTime.UtcNow.AddDays(-2),
                    EndTime = DateTime.UtcNow.AddDays(-1), // Vencida sin pujas
                    State = AuctionState.Closed,
                    ImageUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
                });
            }

            await context.SaveChangesAsync();
        }

        // 4. Resetear y garantizar fechas y estados activos de subastas 1 y 2 en cada re-siembra
        var auctionsToReset = await context.Auctions.ToListAsync();
        foreach (var a in auctionsToReset)
        {
            if (a.Id == 1 || a.Title.Contains("Laptop") || a.Title.Contains("PlayStation"))
            {
                a.State = AuctionState.Active;
                a.StartTime = DateTime.UtcNow.AddMinutes(-30);
                a.EndTime = DateTime.UtcNow.AddHours(2);
                a.CurrentPrice = 45000m;
            }
            else if (a.Id == 2 || a.Title.Contains("Smartphone") || a.Title.Contains("Rolex"))
            {
                a.State = AuctionState.Active;
                a.StartTime = DateTime.UtcNow.AddMinutes(-10);
                a.EndTime = DateTime.UtcNow.AddSeconds(45); // < 60s (Anti-sniping zone)
                a.CurrentPrice = 15000m;
            }
        }
        await context.SaveChangesAsync();

        // 5. Restablecer exactamente el historial de pujas para la subasta 1 (comprador1 liderando a $45.000)
        var auction1Obj = await context.Auctions.FirstOrDefaultAsync(a => a.Id == 1 || a.Title.Contains("Laptop") || a.Title.Contains("PlayStation"));
        if (auction1Obj != null && userIds.TryGetValue("comprador1@test.com", out var comp1Id))
        {
            var oldBids = await context.Bids.Where(b => b.AuctionId == auction1Obj.Id).ToListAsync();
            context.Bids.RemoveRange(oldBids);
            await context.SaveChangesAsync();

            context.Bids.Add(new Bid
            {
                AuctionId = auction1Obj.Id,
                BidderId = comp1Id,
                Amount = 45000m,
                Timestamp = DateTime.UtcNow.AddMinutes(-2)
            });
            await context.SaveChangesAsync();

            var walletComprador1 = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == comp1Id);
            if (walletComprador1 != null && !await context.TransactionLedgers.AnyAsync(t => t.WalletId == walletComprador1.Id && t.Type == TransactionType.Hold))
            {
                context.TransactionLedgers.Add(new TransactionLedger
                {
                    WalletId = walletComprador1.Id,
                    Type = TransactionType.Hold,
                    Amount = 45000m,
                    AuctionId = auction1Obj.Id,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-2)
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
