using Microsoft.EntityFrameworkCore.Storage;
using SubastaYa.Api.Domain.Entities;

namespace SubastaYa.Api.Application.Interfaces;

/// <summary>
/// Contrato del repositorio de acceso a datos para Wallets y TransactionLedger.
/// </summary>
public interface IWalletRepository
{
    /// <summary>
    /// Busca la billetera vinculada a un usuario específico por su identificador.
    /// </summary>
    Task<Wallet?> GetByUserIdAsync(string userId, CancellationToken ct = default);

    /// <summary>
    /// Busca una billetera por su clave primaria (Id).
    /// </summary>
    Task<Wallet?> GetByIdAsync(int walletId, CancellationToken ct = default);

    /// <summary>
    /// Registra una nueva entidad Wallet en el contexto de base de datos.
    /// </summary>
    Task AddAsync(Wallet wallet, CancellationToken ct = default);

    /// <summary>
    /// Marca la entidad Wallet como modificada para su persistencia.
    /// </summary>
    void Update(Wallet wallet);

    /// <summary>
    /// Inserta un nuevo registro en el libro contable de transacciones (Ledger).
    /// </summary>
    Task AddTransactionAsync(TransactionLedger transaction, CancellationToken ct = default);

    /// <summary>
    /// Obtiene las transacciones de una billetera ordenadas por fecha descendente.
    /// </summary>
    Task<IEnumerable<TransactionLedger>> GetTransactionsByWalletIdAsync(int walletId, CancellationToken ct = default);

    /// <summary>
    /// Guarda todos los cambios pendientes en la base de datos.
    /// </summary>
    Task SaveChangesAsync(CancellationToken ct = default);

    /// <summary>
    /// Inicia una transacción explícita de base de datos para operaciones atómicas.
    /// </summary>
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default);
}
