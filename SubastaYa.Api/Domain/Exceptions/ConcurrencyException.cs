namespace SubastaYa.Api.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando dos operaciones concurrentes colisionan sobre el mismo recurso.
/// Se mapea a HTTP 409 Conflict.
/// </summary>
public class ConcurrencyException : Exception
{
    public ConcurrencyException(string message) : base(message) { }
}
