using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SubastaYa.Api.Domain.Entities;

public class Wallet
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty; // Relacion con IdentityUser
    
    public decimal TotalBalance { get; set; }
    public decimal RetainedBalance { get; set; } // Saldo retenido (Escrow)
    
    // Alias para compatibilidad con requerimientos de interfaz y Escrow
    [NotMapped]
    public decimal HeldBalance { get => RetainedBalance; set => RetainedBalance = value; }

    // Propiedad calculada, no se guarda en BD
    [NotMapped]
    public decimal AvailableBalance => TotalBalance - RetainedBalance;

    // Concurrencia Optimista
    [Timestamp]
    public byte[] Version { get; set; } = Array.Empty<byte>();
}
