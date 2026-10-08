namespace SubastaYa.Api.Application.CQRS;

/// <summary>Handler para queries.</summary>
public interface IQueryHandler<TQuery, TResult> where TQuery : IQuery<TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken ct = default);
}
