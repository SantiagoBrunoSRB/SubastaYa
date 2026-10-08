using Microsoft.EntityFrameworkCore.Storage;

namespace SubastaYa.Api.Application.Interfaces.Persistence;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default);
}
