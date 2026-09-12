namespace SubastaYa.Api.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty; // ej. "PlaceBid", "Deposit"
    public string UserId { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty; // JSON con datos del evento
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
