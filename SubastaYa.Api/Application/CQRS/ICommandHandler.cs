namespace SubastaYa.Api.Application.CQRS;

/// <summary>Handler para comandos sin valor de retorno.</summary>
public interface ICommandHandler<TCommand> where TCommand : ICommand
{
    Task HandleAsync(TCommand command, CancellationToken ct = default);
}

/// <summary>Handler para comandos con valor de retorno.</summary>
public interface ICommandHandler<TCommand, TResult> where TCommand : ICommand<TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken ct = default);
}
