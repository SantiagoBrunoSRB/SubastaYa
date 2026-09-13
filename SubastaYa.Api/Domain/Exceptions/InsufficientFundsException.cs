namespace SubastaYa.Api.Domain.Exceptions;

public class InsufficientFundsException : DomainException
{
    public decimal AvailableBalance { get; }
    public decimal RequestedAmount { get; }

    public InsufficientFundsException(decimal availableBalance, decimal requestedAmount)
        : base($"Fondos insuficientes. Saldo disponible: {availableBalance:C}, monto solicitado: {requestedAmount:C}.")
    {
        AvailableBalance = availableBalance;
        RequestedAmount = requestedAmount;
    }

    public InsufficientFundsException(decimal availableBalance, decimal requestedAmount, string message)
        : base(message)
    {
        AvailableBalance = availableBalance;
        RequestedAmount = requestedAmount;
    }
}
