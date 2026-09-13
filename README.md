# SubastaYa 🏷️💰

Plataforma web de subastas en tiempo real desarrollada en **.NET 8 (C#)** y **MySQL (EF Core)** con arquitectura limpia, sistema de billetera virtual (Escrow), worker en segundo plano para cierre automatizado y WebSockets vía **SignalR**.

---

## 🚀 Rama: `feature/wallet-worker` (Desarrollador B - Ariel)

Esta rama contiene la implementación de extremo a extremo del **Módulo de Billetera, Tareas en Segundo Plano y Tiempo Real**.

---

## 📦 Componentes Implementados

### 1. 💼 Billetera Virtual y Sistema de Escrow
* **Gestión de Saldos**:
  * `TotalBalance`: Saldo total del usuario.
  * `RetainedBalance`: Saldo retenido en garantía (Escrow) durante una puja activa.
  * `AvailableBalance`: Saldo disponible para operar (`TotalBalance - RetainedBalance`).
* **Libro Contable (`TransactionLedger`)**:
  * Registro inmutable de cada movimiento contable: `Deposit`, `Hold`, `Release`, `Debit`, `Credit`.
* **Servicio de Dominio / Aplicación (`WalletService`)**:
  * Auto-creación de billetera al primer acceso.
  * Retenciones atómicas de saldo (`ReplaceHoldAsync`) para soportar la concurrencia de pujas.
  * Liquidación final entre comprador y vendedor (`SettleAuctionAsync`).

### 2. 🤖 Worker en Segundo Plano (`AuctionClosingWorker`)
* Servicio en background (`BackgroundService`) que corre periódicamente en segundo plano (cada 10s):
  1. Detecta subastas activas cuya fecha límite (`EndTime`) haya expirado.
  2. Identifica la puja más alta ganadora.
  3. Ejecuta la liquidación de fondos: debita el saldo retenido del ganador y lo acredita a la billetera del vendedor.
  4. Actualiza el estado de la subasta a `Closed`.
  5. Registra el evento en la tabla `AuditLogs`.
  6. Emite notificaciones en vivo a través de SignalR (`AuctionClosed`).

### 3. ⚡ Tiempo Real con WebSockets (`AuctionHub`)
* Hub de **SignalR** montado en el endpoint `/auctionHub`.
* Gestión de salas por subasta (`JoinAuctionGroup` / `LeaveAuctionGroup`).
* Notificación de eventos a clientes: `AuctionClosed` y recepción de pujas en vivo.

### 4. 🌐 API REST (`WalletsController`)
Endpoints HTTP documentados en Swagger para consultar saldos, depositar y consultar historial de transacciones.

---

## 🔄 Ciclo de Vida del Dinero y Sistema Escrow

```text
[ Usuario deposita $2000 ] ──> Total: $2000 | Retenido: $0    | Disponible: $2000
                                       │
[ Usuario puja $1500 ]     ──> Total: $2000 | Retenido: $1500 | Disponible: $500 (Escrow bloqueado)
                                       │
     ┌─────────────────────────────────┴─────────────────────────────────┐
     ▼                                                                   ▼
[ Puja superada por otro ]                                  [ Subasta finaliza con éxito ]
Total: $2000 | Retenido: $0 | Disponible: $2000             Comprador: Total -$1500 | Retenido: $0
(Fondos liberados automáticamente)                          Vendedor:  Total +$1500 (Acreditado)
```

---

## 🤝 Guía de Integración para el Desarrollador A (Punto de Encuentro)

Para conectar el módulo de Subastas y Pujas con la Billetera en `PlaceBidUseCase`, inyectar `IWalletService`:

```csharp
public class PlaceBidUseCase
{
    private readonly IWalletService _walletService;

    public PlaceBidUseCase(IWalletService walletService)
    {
        _walletService = walletService;
    }

    public async Task ExecuteAsync(string bidderId, decimal amount, int auctionId, string? previousBidderId, decimal? previousAmount, CancellationToken ct)
    {
        // 1. Validar que el nuevo postor tenga fondos disponibles suficientes
        var hasFunds = await _walletService.HasSufficientBalanceAsync(bidderId, amount, ct);
        if (!hasFunds)
            throw new InsufficientFundsException(availableBalance: 0, requestedAmount: amount);

        // 2. Operación atómica de Escrow: libera al anterior y bloquea los fondos del nuevo postor
        await _walletService.ReplaceHoldAsync(
            previousBidderId: previousBidderId,
            previousAmount: previousAmount,
            newBidderId: bidderId,
            newAmount: amount,
            auctionId: auctionId,
            ct: ct
        );
    }
}
```

---

## 📄 Especificación de Endpoints REST (API Billetera)

### 1. Consultar Saldo
* **Método & Ruta:** `GET /api/wallets/{userId}/balance`
* **Respuesta Exitosa (200 OK):**
```json
{
  "userId": "user-ariel-123",
  "totalBalance": 2500.00,
  "heldBalance": 500.00,
  "availableBalance": 2000.00
}
```

### 2. Depositar Fondos
* **Método & Ruta:** `POST /api/wallets/{userId}/deposit`
* **Cuerpo de Solicitud (Body):**
```json
{
  "amount": 1000.00
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "userId": "user-ariel-123",
  "totalBalance": 3500.00,
  "heldBalance": 500.00,
  "availableBalance": 3000.00
}
```

### 3. Historial de Transacciones (Ledger)
* **Método & Ruta:** `GET /api/wallets/{userId}/transactions`
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 1,
    "walletId": 1,
    "type": "Deposit",
    "amount": 1000.00,
    "createdAt": "2026-09-13T08:03:03.152Z",
    "auctionId": null
  },
  {
    "id": 2,
    "walletId": 1,
    "type": "Hold",
    "amount": 500.00,
    "createdAt": "2026-09-13T08:15:20.000Z",
    "auctionId": 10
  }
]
```

---

## 📡 Contrato de Eventos SignalR (WebSockets)

* **URL del Hub:** `http://localhost:5110/auctionHub`
* **Métodos invocables por el cliente:**
  * `JoinAuctionGroup(auctionId)`: Une al cliente a la sala de una subasta.
  * `LeaveAuctionGroup(auctionId)`: Desuscribe al cliente de la sala.
* **Eventos emitidos por el servidor:**
  * `AuctionClosed`:
  ```json
  {
    "auctionId": 10,
    "title": "Notebook Gamer RTX 4080",
    "winnerId": "user-ariel-123",
    "finalPrice": 1500.00,
    "state": "Closed"
  }
  ```

---

## 🏛️ Estructura de Capas

```text
SubastaYa.Api/
├── Application/
│   ├── DTOs/                      # DepositRequestDto, WalletBalanceResponseDto, TransactionResponseDto
│   ├── Interfaces/                # IWalletService, IWalletRepository
│   └── Services/                  # WalletService (Lógica de negocio y Escrow)
├── Domain/
│   ├── Entities/                  # Wallet, TransactionLedger, Auction, Bid, AuditLog
│   ├── Enums/                     # TransactionType, AuctionState
│   └── Exceptions/                # InsufficientFundsException, InvalidAmountException, WalletNotFoundException
├── Infrastructure/
│   ├── BackgroundServices/        # AuctionClosingWorker
│   ├── Data/                      # AppDbContext, Migraciones de EF Core
│   └── Repositories/              # WalletRepository
└── Presentation/
    ├── Controllers/               # WalletsController
    └── Hubs/                      # AuctionHub (SignalR)
```

---

## 🛠️ Requisitos y Ejecución

* **.NET SDK**: 8.0+
* **Motor de Base de Datos**: MySQL (XAMPP / MariaDB en puerto `3306`)
* **Cadena de Conexión**: Configurada en `SubastaYa.Api/appsettings.Development.json` (`Database=SubastaYaDb`).

### Pasos para iniciar el proyecto:
```powershell
# 1. Restaurar dependencias y compilar
dotnet build

# 2. Aplicar migraciones a MySQL
dotnet ef database update --project SubastaYa.Api

# 3. Ejecutar la API
dotnet run --project SubastaYa.Api --launch-profile "http"
```
* **Swagger UI:** `http://localhost:5110/swagger`
* **SignalR Endpoint:** `http://localhost:5110/auctionHub`
