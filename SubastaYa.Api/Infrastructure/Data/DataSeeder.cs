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

        // 3. Crear Subastas de Prueba
        if (await context.Auctions.CountAsync() < 5)
        {
            var vendedorId = userIds["vendedor@test.com"];
            var comprador1Id = userIds["comprador1@test.com"];

            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("PlayStation")))
            {
                var auction1 = new Auction
                {
                    Title = "PlayStation 5 Pro",
                    Description = "Consola casi nueva en excelente estado.",
                    Category = "Tecnología",
                    StartingPrice = 40000m,
                    CurrentPrice = 45000m, // Comprador 1 lidera
                    SellerId = vendedorId,
                    StartTime = DateTime.UtcNow.AddMinutes(-10),
                    EndTime = DateTime.UtcNow.AddMinutes(20),
                    State = AuctionState.Active
                };
                auction1.Bids.Add(new Bid { Amount = 42000m, BidderId = comprador1Id, Timestamp = DateTime.UtcNow.AddMinutes(-5) });
                auction1.Bids.Add(new Bid { Amount = 45000m, BidderId = comprador1Id, Timestamp = DateTime.UtcNow.AddMinutes(-2) });
                context.Auctions.Add(auction1);
            }

            if (!await context.Auctions.AnyAsync(a => a.Title.Contains("Rolex")))
            {
                context.Auctions.Add(new Auction
                {
                    Title = "Reloj Rolex Vintage",
                    Description = "Reloj de colección.",
                    Category = "Coleccionables",
                    StartingPrice = 10000m,
                    CurrentPrice = 10000m,
                    SellerId = vendedorId,
                    StartTime = DateTime.UtcNow.AddMinutes(-5),
                    EndTime = DateTime.UtcNow.AddSeconds(110), // Activa crítica (menos de 2 min)
                    State = AuctionState.Active
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
                    SellerId = vendedorId,
                    StartTime = DateTime.UtcNow.AddHours(24),
                    EndTime = DateTime.UtcNow.AddHours(48), // Próxima
                    State = AuctionState.Active
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
                    SellerId = vendedorId,
                    StartTime = DateTime.UtcNow.AddDays(-2),
                    EndTime = DateTime.UtcNow.AddDays(-1), // Vencida
                    State = AuctionState.Closed
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
                    SellerId = vendedorId,
                    StartTime = DateTime.UtcNow.AddDays(-2),
                    EndTime = DateTime.UtcNow.AddDays(-1), // Vencida sin pujas
                    State = AuctionState.Closed
                });
            }

            await context.SaveChangesAsync();
        }

        // 4. Agregar el ledger de la retención (Hold) para la subasta 1 de comprador1 si falta
        if (userIds.TryGetValue("comprador1@test.com", out var comp1Id))
        {
            var walletComprador1 = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == comp1Id);
            if (walletComprador1 != null && !await context.TransactionLedgers.AnyAsync(t => t.WalletId == walletComprador1.Id && t.Type == TransactionType.Hold))
            {
                var auction1 = await context.Auctions.FirstOrDefaultAsync(a => a.Title.Contains("PlayStation"));
                context.TransactionLedgers.Add(new TransactionLedger
                {
                    WalletId = walletComprador1.Id,
                    Type = TransactionType.Hold,
                    Amount = 45000m,
                    AuctionId = auction1?.Id,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-2)
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
