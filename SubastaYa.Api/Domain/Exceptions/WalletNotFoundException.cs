namespace SubastaYa.Api.Domain.Exceptions;

public class WalletNotFoundException : DomainException
{
    public string? UserId { get; }
    public int? WalletId { get; }

    public WalletNotFoundException(string userId)
        : base($"No se encontrÃ³ la billetera para el usuario con ID '{userId}'.")
    {
        UserId = userId;
    }

    public WalletNotFoundException(int walletId)
        : base($"No se encontrÃ³ la billetera con ID '{walletId}'.")
    {
        WalletId = walletId;
    }

    public WalletNotFoundException(string? userId, int? walletId, string message)
        : base(message)
    {
        UserId = userId;
        WalletId = walletId;
    }
}
