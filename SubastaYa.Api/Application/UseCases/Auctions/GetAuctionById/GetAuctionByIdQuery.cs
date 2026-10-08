using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs.Auctions;

namespace SubastaYa.Api.Application.UseCases.Auctions.GetAuctionById;

/// <summary>Query para obtener el detalle de una subasta por ID.</summary>
public record GetAuctionByIdQuery(int Id) : IQuery<AuctionDetailResponseDto>;
