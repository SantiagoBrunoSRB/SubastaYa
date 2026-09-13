namespace SubastaYa.Api.Application.DTOs;

public record TransactionResponseDto(
    int Id,
    int WalletId,
    string Type,
    decimal Amount,
    DateTime CreatedAt,
    int? AuctionId
);
