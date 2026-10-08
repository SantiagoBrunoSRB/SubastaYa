using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs.Auctions;

namespace SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;

/// <summary>Comando para crear una nueva subasta. Retorna el ID generado.</summary>
public record CreateAuctionCommand(CreateAuctionRequestDto Request, string SellerId) : ICommand<int>;
