using SubastaYa.Api.Domain.Entities;

namespace SubastaYa.Api.Application.Interfaces.Persistence;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog auditLog, CancellationToken cancellationToken = default);
}
