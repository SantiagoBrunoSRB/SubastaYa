using System.Net;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Domain.Exceptions;

namespace SubastaYa.Api.Presentation.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            // Las excepciones de dominio son errores del cliente (reglas de negocio no cumplidas)
            _logger.LogWarning(ex, "Domain Exception: {Message}", ex.Message);
            
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var problem = new ProblemDetails
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Error de validación",
                Detail = ex.Message
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
        catch (Exception ex)
        {
            // Cualquier otro error no manejado es un 500
            _logger.LogError(ex, "Unhandled Exception: {Message}", ex.Message);
            
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var problem = new ProblemDetails
            {
                Status = (int)HttpStatusCode.InternalServerError,
                Title = "Error interno del servidor",
                Detail = "Ha ocurrido un error inesperado."
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
