using Microsoft.AspNetCore.Identity;
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

        // 1. Usuarios a crear
        var usersToSeed = new[]
        {
            new { Email = "vendedor@test.com", InitialDeposit = 0m, Held = 0m },
            new { Email = "comprador1@test.com", InitialDeposit = 150000m, Held = 45000m },
            new { Email = "comprador2@test.com", InitialDeposit = 200000m, Held = 0m },
            new { Email = "sinfondos@test.com", InitialDeposit = 500m, Held = 0m }
        };

        var userIds = new Dictionary<string, string>();

        // 2. Crear usuarios y billeteras
        foreach (var u in usersToSeed)
        {
            var user = await userManager.FindByEmailAsync(u.Email);
            if (user == null)
            {
                user = new IdentityUser { UserName = u.Email, Email = u.Email };
                var result = await userManager.CreateAsync(user, "Password123!");
                if (result.Succeeded)
                {
                    // Crear billetera para el usuario
                    var wallet = new Wallet
                    {
                        UserId = user.Id,
                        TotalBalance = u.InitialDeposit,
                        HeldBalance = u.Held
                    };
                    context.Wallets.Add(wallet);
                    
                    if (u.InitialDeposit > 0)
                    {
                        context.TransactionLedgers.Add(new TransactionLedger
                        {
                            Wallet = wallet,
                            Type = TransactionType.Deposit,
                            Amount = u.InitialDeposit,
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        });
                    }
                }
            }
            userIds[u.Email] = user.Id;
        }

        await context.SaveChangesAsync();

        // 3. Crear Subastas de Prueba
        if (!context.Auctions.Any())
        {
            var vendedorId = userIds["vendedor@test.com"];
            var comprador1Id = userIds["comprador1@test.com"];

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
            
            // Simular las pujas previas
            auction1.Bids.Add(new Bid { Amount = 42000m, BidderId = comprador1Id, Timestamp = DateTime.UtcNow.AddMinutes(-5) });
            auction1.Bids.Add(new Bid { Amount = 45000m, BidderId = comprador1Id, Timestamp = DateTime.UtcNow.AddMinutes(-2) });

            var auction2 = new Auction
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
            };

            var auction3 = new Auction
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
            };

            var auction4 = new Auction
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
            };

            var auction5 = new Auction
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
            };

            context.Auctions.AddRange(auction1, auction2, auction3, auction4, auction5);
            await context.SaveChangesAsync();

            // Agregar el ledger de la retención para la subasta 1
            var walletComprador1 = context.Wallets.FirstOrDefault(w => w.UserId == comprador1Id);
            if (walletComprador1 != null)
            {
                context.TransactionLedgers.Add(new TransactionLedger
                {
                    WalletId = walletComprador1.Id,
                    Type = TransactionType.Hold,
                    Amount = 45000m,
                    AuctionId = auction1.Id,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-2)
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
