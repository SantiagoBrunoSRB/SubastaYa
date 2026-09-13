using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Api.Application.DTOs;

public record DepositRequestDto(
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0")]
    decimal Amount
);
