using SubastaYa.Api.Application.CQRS;
using SubastaYa.Api.Application.DTOs.Auctions;

namespace SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;

/// <summary>Query para obtener la lista de subastas con filtros opcionales.</summary>
public record GetAuctionsQuery(bool IncludeClosed, string? SellerId) : IQuery<IEnumerable<AuctionResponseDto>>;
