using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
// using SubastaYa.Api.Domain.Entities; // Comentado temporalmente hasta que se creen las entidades

namespace SubastaYa.Api.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // TODO: Descomentar cuando existan las entidades
        // public DbSet<Auction> Auctions { get; set; }
        // public DbSet<Wallet> Wallets { get; set; }
        // public DbSet<Bid> Bids { get; set; }
        // public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}
