namespace SubastaYa.Api.Domain.Exceptions;

public class InvalidAmountException : DomainException
{
    public decimal Amount { get; }

    public InvalidAmountException(decimal amount)
        : base($"El monto especificado ({amount}) no es vÃ¡lido. Debe ser un valor positivo.")
    {
        Amount = amount;
    }

    public InvalidAmountException(decimal amount, string message)
        : base(message)
    {
        Amount = amount;
    }
}
