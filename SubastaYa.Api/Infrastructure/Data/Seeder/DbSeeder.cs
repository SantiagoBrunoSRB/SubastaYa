using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Domain.Entities;
using SubastaYa.Api.Domain.Enums;

namespace SubastaYa.Api.Infrastructure.Data.Seeder;

/// <summary>
/// Creador e inicializador de datos semilla (Seed Data) exigidos por la cátedra para pruebas y demostración.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, UserManager<IdentityUser> userManager)
    {
        // 1. Asegurar que las migraciones estén aplicadas en MySQL
        await context.Database.MigrateAsync();

        // Si ya existen usuarios, no volver a sembrar para evitar duplicados
        if (await context.Users.AnyAsync())
        {
            return;
        }

        // 2. Crear Usuarios de Prueba (Identity)
        var sellerUser = new IdentityUser
        {
            UserName = "vendedor@test.com",
            Email = "vendedor@test.com",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(sellerUser, "Password123!");

        var buyer1User = new IdentityUser
        {
            UserName = "comprador1@test.com",
            Email = "comprador1@test.com",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(buyer1User, "Password123!");

        var buyer2User = new IdentityUser
        {
            UserName = "comprador2@test.com",
            Email = "comprador2@test.com",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(buyer2User, "Password123!");

        var noFundsUser = new IdentityUser
        {
            UserName = "sinfondos@test.com",
            Email = "sinfondos@test.com",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(noFundsUser, "Password123!");

        // 3. Crear Billeteras (Wallets) según especificaciones de la cátedra
        var sellerWallet = new Wallet
        {
            UserId = sellerUser.Id,
            TotalBalance = 0,
            RetainedBalance = 0
        };

        var buyer1Wallet = new Wallet
        {
            UserId = buyer1User.Id,
            TotalBalance = 150000m,
            RetainedBalance = 45000m // Postor líder ($45.000 retenidos, $105.000 disponibles)
        };

        var buyer2Wallet = new Wallet
        {
            UserId = buyer2User.Id,
            TotalBalance = 200000m,
            RetainedBalance = 0m // Postor habilitado ($200.000 disponibles)
        };

        var noFundsWallet = new Wallet
        {
            UserId = noFundsUser.Id,
            TotalBalance = 500m,
            RetainedBalance = 0m // Sin saldo suficiente para pujas estándar ($500 disponibles)
        };

        context.Wallets.AddRange(sellerWallet, buyer1Wallet, buyer2Wallet, noFundsWallet);
        await context.SaveChangesAsync();

        // 4. Crear Subastas (Casos de Prueba exigidos)
        var auction1 = new Auction
        {
            Title = "Laptop Gamer Pro RTX 4080 (Tecnología)",
            Description = "Laptop de alta gama con 32GB RAM y pantalla OLED 240Hz.",
            StartingPrice = 30000m,
            CurrentPrice = 45000m,
            SellerId = sellerUser.Id,
            StartTime = DateTime.UtcNow.AddMinutes(-30),
            EndTime = DateTime.UtcNow.AddMinutes(25), // Activa estándar (Cierra en ~25 min)
            State = AuctionState.Active
        };

        var auction2 = new Auction
        {
            Title = "Smartphone Flagship OLED (Tecnología)",
            Description = "Teléfono móvil con cámara de 200MP y carga ultrarrápida.",
            StartingPrice = 15000m,
            CurrentPrice = 15000m,
            SellerId = sellerUser.Id,
            StartTime = DateTime.UtcNow.AddMinutes(-60),
            EndTime = DateTime.UtcNow.AddSeconds(90), // Activa crítica (Cierra en < 2 min para test anti-sniping)
            State = AuctionState.Active
        };

        var auction3 = new Auction
        {
            Title = "Colección de Cómics Raros #1 (Coleccionables)",
            Description = "Edición limitada de cómics retro conservada en estuche hermético.",
            StartingPrice = 50000m,
            CurrentPrice = 50000m,
            SellerId = sellerUser.Id,
            StartTime = DateTime.UtcNow.AddHours(24), // Próxima (Inicio en +24 hs)
            EndTime = DateTime.UtcNow.AddHours(48),
            State = AuctionState.Active
        };

        var auction4 = new Auction
        {
            Title = "Reloj Antiguo de Colección (Coleccionables)",
            Description = "Reloj de bolsillo suizo automático bañado en oro.",
            StartingPrice = 20000m,
            CurrentPrice = 35000m,
            SellerId = sellerUser.Id,
            StartTime = DateTime.UtcNow.AddHours(-5),
            EndTime = DateTime.UtcNow.AddMinutes(-10), // Vencida con ganador (Para test de liquidación del Worker)
            State = AuctionState.Active
        };

        var auction5 = new Auction
        {
            Title = "Cuadro al Óleo Vintage (Arte)",
            Description = "Pintura al óleo sobre lienzo firmada de 1975.",
            StartingPrice = 10000m,
            CurrentPrice = 10000m,
            SellerId = sellerUser.Id,
            StartTime = DateTime.UtcNow.AddHours(-5),
            EndTime = DateTime.UtcNow.AddMinutes(-5), // Vencida desierta (Sin pujas para test del Worker a DESIERTA)
            State = AuctionState.Active
        };

        context.Auctions.AddRange(auction1, auction2, auction3, auction4, auction5);
        await context.SaveChangesAsync();

        // 5. Registrar Pujas de Prueba (Bids)
        var bid1 = new Bid
        {
            AuctionId = auction1.Id,
            BidderId = buyer2User.Id,
            Amount = 40000m,
            Timestamp = DateTime.UtcNow.AddMinutes(-20)
        };

        var bid2 = new Bid
        {
            AuctionId = auction1.Id,
            BidderId = buyer1User.Id,
            Amount = 45000m, // Puja líder respaldada por los $45.000 retenidos
            Timestamp = DateTime.UtcNow.AddMinutes(-10)
        };

        var bid3 = new Bid
        {
            AuctionId = auction4.Id,
            BidderId = buyer1User.Id,
            Amount = 35000m,
            Timestamp = DateTime.UtcNow.AddMinutes(-15)
        };

        context.Bids.AddRange(bid1, bid2, bid3);

        // 6. Registrar Movimientos Contables (TransactionLedger)
        var ledger1 = new TransactionLedger
        {
            WalletId = buyer1Wallet.Id,
            Type = TransactionType.Deposit,
            Amount = 150000m,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        var ledger2 = new TransactionLedger
        {
            WalletId = buyer1Wallet.Id,
            Type = TransactionType.Hold,
            Amount = 45000m,
            AuctionId = auction1.Id,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        var ledger3 = new TransactionLedger
        {
            WalletId = buyer2Wallet.Id,
            Type = TransactionType.Deposit,
            Amount = 200000m,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        var ledger4 = new TransactionLedger
        {
            WalletId = noFundsWallet.Id,
            Type = TransactionType.Deposit,
            Amount = 500m,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.TransactionLedgers.AddRange(ledger1, ledger2, ledger3, ledger4);

        // 7. Guardar todos los datos semilla
        await context.SaveChangesAsync();
    }
}
