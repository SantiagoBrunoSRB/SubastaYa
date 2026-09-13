namespace SubastaYa.Api.Application.DTOs;

public record WalletBalanceResponseDto(
    string UserId,
    decimal TotalBalance,
    decimal HeldBalance,
    decimal AvailableBalance
);
