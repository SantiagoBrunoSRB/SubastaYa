namespace SubastaYa.Api.Application.CQRS;

/// <summary>Marcador para comandos que no retornan valor.</summary>
public interface ICommand { }

/// <summary>Marcador para comandos que retornan un valor.</summary>
public interface ICommand<TResult> { }
