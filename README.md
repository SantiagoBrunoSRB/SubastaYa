# 🏛️ SubastaYa — Plataforma de Subastas en Tiempo Real

> **Cátedra:** Proyecto de Software  
> **Integrantes:** Santiago Bruno, Ariel Carriego  
> **Repositorio Oficial:** [https://github.com/SantiagoBrunoSRB/SubastaYa.git](https://github.com/SantiagoBrunoSRB/SubastaYa.git)

---

## 📌 Tabla de Contenidos
1. [Descripción del Proyecto y Pilares de Negocio](#1-descripción-del-proyecto-y-pilares-de-negocio)
2. [Arquitectura del Sistema y Patrones](#2-arquitectura-del-sistema-y-patrones)
3. [Pila Tecnológica](#3-pila-tecnológica)
4. [Estructura del Repositorio](#4-estructura-del-repositorio)
5. [Guía de Instalación y Ejecución Paso a Paso](#5-guía-de-instalación-y-ejecución-paso-a-paso)
6. [Datos Semilla Obligatorios (Seed Data)](#6-datos-semilla-obligatorios-seed-data)
7. [Documentación de la API REST y Endpoints Reales](#7-documentación-de-la-api-rest-y-endpoints-reales)
8. [Comunicación en Tiempo Real (SignalR WebSockets)](#8-comunicación-en-tiempo-real-signalr-websockets)
9. [Procesos en Segundo Plano (Background Worker)](#9-procesos-en-segundo-plano-background-worker)
10. [Control de Concurrencia Optimista y Prueba de Estrés](#10-control-de-concurrencia-optimista-y-prueba-de-estrés)
11. [Matriz de Cumplimiento de Requisitos](#11-matriz-de-cumplimiento-de-requisitos)

---

## 1. Descripción del Proyecto y Pilares de Negocio

**SubastaYa** es una plataforma web integral de subastas en vivo y comercio electrónico estructurada sobre dos pilares críticos de diseño de software y dominio financiero:

1. **Confianza y Solvencia Económica (Garantía / Escrow):**  
   Toda puja realizada en el sistema está respaldada por dinero real disponible en la billetera virtual del usuario. Al enviar una oferta líder, los fondos equivalentes se congelan en estado **Retenido** (`RetainedBalance`). Si un participante posterior supera válidamente dicha oferta, el sistema ejecuta una transacción atómica que **libera de inmediato la retención previa** devolviéndola al saldo disponible y **bloquea el saldo del nuevo líder**.
2. **Juego Limpio (*Fair Play* y Anti-Sniping):**  
   Para neutralizar el *sniping* automatizado mediante bots o ventajas por latencia de red, cualquier oferta válida registrada dentro de los últimos **60 segundos** previos al cierre de la subasta gatilla una **extensión automática de 2 minutos adicionales** en la fecha de finalización (`EndTime`), permitiendo la reacción justa de los demás postores.

---

## 2. Arquitectura del Sistema y Patrones

El backend sigue los principios de **Clean Architecture / Domain-Driven Design (DDD)** con separación física en capas lógicas dentro de un único proyecto escalable:

```text
SubastaYa.slnx
├── SubastaYa.Api/                      # Proyecto Backend (.NET 8 Web API)
│   ├── Domain/                         # Núcleo de Dominio (Sin dependencias externas)
│   │   ├── Entities/                   # Auction, Wallet, Bid, TransactionLedger, AuditLog
│   │   ├── Enums/                      # AuctionState, TransactionType
│   │   └── Exceptions/                 # DomainException, InsufficientFundsException, etc.
│   ├── Application/                    # Capa de Aplicación y Casos de Uso
│   │   ├── DTOs/                       # Objetos de transferencia de datos
│   │   ├── Interfaces/                 # Contratos de Servicios y Persistencia
│   │   ├── Services/                   # WalletService (Escrow, Ledger), AuthService (JWT)
│   │   └── UseCases/                   # CreateAuction, GetAuctions, GetAuctionById, PlaceBid
│   ├── Infrastructure/                 # Capa de Infraestructura y Persistencia
│   │   ├── BackgroundServices/         # AuctionClosingWorker (Cierre y Liquidación periódica)
│   │   ├── Data/                       # AppDbContext, Migraciones Code-First, DbSeeder / DataSeeder
│   │   └── Repositories/               # Repositorios concretos y UnitOfWork
│   └── Presentation/                   # Capa de Presentación HTTP y WebSockets
│       ├── Controllers/                # AuctionsController, WalletsController, AuthController
│       ├── Hubs/                       # AuctionHub (SignalR WebSockets)
│       └── Middleware/                 # GlobalExceptionMiddleware (RFC 7807 ProblemDetails)
├── frontend/                           # Aplicación Web Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/                 # Componentes UI modulares (AuctionCard, BidConsole, Timer, etc.)
│   │   ├── contexts/                   # WalletContext (Estado global y Optimistic UI updates)
│   │   ├── pages/                      # HomePage, AuctionDetailPage, CreateAuctionPage, ProfilePage, WalletPage
│   │   └── services/                   # api.js (cliente HTTP con JWT) y signalrService.js (WebSockets)
├── tests/                              # Suite de pruebas automatizadas en Python (Pytest + HTTPX)
│   ├── test_section1_seed_data.py      # Verificación de saldos semilla, catálogo y ledger
│   ├── test_section2_concurrency.py    # Test de estrés de concurrencia optimista y anti-sniping
│   └── test_section3_scenarios.py      # Escenarios de negocio (fondos insuficientes, subastas próximas, escrow)
└── reports/                            # Informes de ejecución de pruebas
```

### Patrones y Estándares Implementados:
* **Code-First & Migraciones:** Esquema de base de datos relacional generado mediante migraciones controladas de EF Core.
* **Transacciones ACID:** Bloques transaccionales explícitos (`BeginTransactionAsync` / `CommitAsync` / `RollbackAsync`) para operaciones de custodia de fondos y liquidaciones finales.
* **Optimistic Locking:** Control de concurrencia con tokens de versión (`[Timestamp] byte[] Version`) en `Auction` y `Wallet` para evitar condiciones de carrera (*Race Conditions*).
* **Manejo de Errores RFC 7807 (ProblemDetails):** Middleware interceptor que estandariza las respuestas de error ante conflictos de concurrencia (`409 Conflict`), errores de validación (`400 Bad Request`) o recursos inexistentes (`404 Not Found`).
* **WebSockets Bidireccionales:** Sincronización en tiempo real vía SignalR con suscripción a grupos específicos (`Auction_{id}`).

---

## 3. Pila Tecnológica

### Backend
* **Lenguaje y Framework:** C# / .NET 8 (ASP.NET Core Web API)
* **ORM:** Entity Framework Core 8.0 (`Pomelo.EntityFrameworkCore.MySql` v8.0.2)
* **Base de Datos:** MySQL / MariaDB (puerto 3306)
* **Seguridad:** ASP.NET Core Identity + Tokens JWT (`Microsoft.AspNetCore.Authentication.JwtBearer`)
* **Comunicación en Tiempo Real:** ASP.NET Core SignalR
* **Documentación:** Swagger / OpenAPI UI (`Swashbuckle.AspNetCore` v6.4.0)

### Frontend
* **Entorno y Framework:** React 19 / Vite 8
* **Estilos:** Tailwind CSS v4 con paleta personalizada dark-mode
* **Enrutamiento:** React Router v7 (`react-router-dom`)
* **Cliente en Tiempo Real:** `@microsoft/signalr` v10.0.11
* **Iconografía:** `lucide-react`
* **Cliente HTTP:** Fetch API modularizada con inyección de Bearer Token en cabeceras

### Testing Automatizado
* **Frameworks:** Python 3.10+, `pytest`, `httpx` (Async HTTP) y `pytest-asyncio`

---

## 4. Estructura del Repositorio

| Directorio | Propósito |
| :--- | :--- |
| `SubastaYa.Api` | Código fuente del backend en .NET 8. |
| `SubastaYa.Api/Infrastructure/Data/Migrations` | Migraciones Code-First que modelan la base de datos. |
| `frontend` | Código fuente de la interfaz de usuario en React + Vite. |
| `tests` | Scripts de prueba automatizada para concurrencia, seed data y lógica de negocio. |
| `reports` | Reportes exportados de ejecuciones de pruebas. |

---

## 5. Guía de Instalación y Ejecución Paso a Paso

### 5.1 Prerrequisitos
* **.NET SDK:** Versión 8.0 o superior ([Descargar .NET 8](https://dotnet.microsoft.com/download/dotnet/8.0))
* **Node.js:** Versión 18.0 o superior ([Descargar Node.js](https://nodejs.org/))
* **Servidor MySQL:** MySQL Server 8.0 / MariaDB / XAMPP corriendo en `localhost:3306`
* **Python (Opcional, para tests):** Versión 3.10+ con `pip`

---

### 5.2 Configuración de la Base de Datos
1. Iniciar el servicio de MySQL (por ejemplo, desde el panel de control de XAMPP o servicio local).
2. Revisar la cadena de conexión en `SubastaYa.Api/appsettings.Development.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=127.0.0.1;Port=3306;Database=SubastaYaDb;User=root;Password=;"
     }
   }
   ```
   *(Modificar usuario y contraseña únicamente si tu instancia local de MySQL tiene credenciales personalizadas).*

---

### 5.3 Ejecución del Backend

1. Abrir una terminal en el directorio del backend:
   ```powershell
   cd SubastaYa.Api
   ```
2. Restaurar dependencias y compilar:
   ```powershell
   dotnet build
   ```
3. Aplicar migraciones Code-First:
   ```powershell
   dotnet ef database update
   ```
   > **Nota:** Al iniciar la aplicación, el seeder integrado (`DbSeeder.SeedAsync`) verificará y aplicará las migraciones pendientes automáticamente y sembrará los datos de prueba.
4. Iniciar el servidor API:
   ```powershell
   dotnet run --launch-profile "http"
   ```
5. **Puntos de acceso del Backend:**
   * **API Base:** `http://localhost:5110/api`
   * **Swagger UI (Documentación interactiva):** `http://localhost:5110/swagger`
   * **SignalR WebSocket Hub:** `http://localhost:5110/auctionHub`

---

### 5.4 Ejecución del Frontend

1. Abrir una segunda terminal en el directorio del frontend:
   ```powershell
   cd frontend
   ```
2. Instalar las dependencias de Node:
   ```powershell
   npm install
   ```
3. Iniciar el servidor de desarrollo de Vite:
   ```powershell
   npm run dev
   ```
4. **Punto de acceso del Frontend:**
   * **Aplicación Web:** `http://localhost:5173`

---

## 6. Datos Semilla Obligatorios (Seed Data)

La base de datos se inicializa con los usuarios, balances, categorías y escenarios de subasta exactos exigidos por la cátedra:

### 👤 Usuarios y Billeteras
* **Contraseña global para todos los usuarios:** `Password123!`

| Usuario (Email) | Rol / Propósito | Saldo Total | Saldo Retenido | Saldo Disponible |
| :--- | :--- | :--- | :--- | :--- |
| `vendedor@test.com` | Creador de subastas | $0 | $0 | $0 |
| `comprador1@test.com` | Postor líder actual | $150.000 | $45.000 | $105.000 |
| `comprador2@test.com` | Postor habilitado | $200.000 | $0 | $200.000 |
| `sinfondos@test.com` | Prueba de saldo insuficiente | $500 | $0 | $500 |

### 🏷️ Categorías Disponibles
* **Tecnología**, **Coleccionables**, **Indumentaria**, **Vehículos** (y adicionales: *Arte*, *Deportes*, *Hogar*).

### 📦 Escenarios de Subasta Sembrados
1. **Activa Estándar (ID #1 - Laptop Gamer Pro RTX 4080):** En curso, finaliza en ~25 min. Posee historial de ofertas previas cargadas y `comprador1@test.com` liderando con una puja de **$45.000**.
2. **Activa Crítica (ID #2 - Smartphone Flagship OLED):** En curso con cierre en **menos de 60 segundos** para probar en vivo la alerta crítica en rojo y la regla **Anti-Sniping** (+2 minutos).
3. **Próxima (ID #3 - Cómics Raros / Camiseta Messi):** Inicio programado a **+24 horas**, consola de pujas bloqueada hasta su apertura oficial.
4. **Vencida con Ganador (ID #4 - Reloj Antiguo de Colección):** Fecha de fin expirada con pujas registradas para validar la liquidación automática y transferencia de fondos del Background Worker.
5. **Vencida Desierta (ID #5 - Cuadro al Óleo Vintage):** Fecha de fin expirada sin ofertas para validar el cierre automático sin liquidación.

---

## 7. Documentación de la API REST y Endpoints Reales

El backend expone endpoints RESTful bajo nombres plurales y jerárquicos:

### Autenticación (`/api/auth`)
* `POST /api/auth/login`: Autentica credenciales y devuelve el token JWT con datos del usuario.
* `POST /api/auth/register`: Registra un nuevo usuario en Identity y genera su token.

### Subastas (`/api/auctions`)
* `GET /api/auctions?includeClosed={bool}&sellerId={id}`: Retorna el catálogo de subastas filtrado.
* `GET /api/auctions/{id}`: Retorna el detalle completo de la subasta con su historial de pujas ordenado cronológicamente.
* `POST /api/auctions`: Publica una nueva subasta (*Requiere `Bearer Token`*).
* `POST /api/auctions/{id}/bids`: Procesa una nueva oferta con validación de saldo, reemplazo atómico de custodia (Escrow), regla anti-sniping y control de concurrencia optimista (*Requiere `Bearer Token`*).
* `GET /api/auctions/my-publications`: Retorna las subastas creadas por el usuario autenticado (*Requiere `Bearer Token`*).

### Billetera y Movimientos (`/api/wallets`)
* `GET /api/wallets/balance`: Retorna el desglose financiero del usuario (`totalBalance`, `heldBalance`, `availableBalance`) (*Requiere `Bearer Token`*).
* `POST /api/wallets/deposit`: Acredita fondos simulados e inserta un registro `Deposit` en el libro mayor contable (*Requiere `Bearer Token`*).
* `GET /api/wallets/transactions`: Retorna el historial de movimientos contables (*Ledger*) con tipos `Deposit`, `Hold`, `Release`, `Debit` y `Credit` (*Requiere `Bearer Token`*).
* `POST /api/wallets/reseed`: Endpoint auxiliar de testing que restablece la base de datos a su estado semilla inicial.

---

## 8. Comunicación en Tiempo Real (SignalR WebSockets)

La vista de sala de subasta (`AuctionDetailPage`) interactúa con el hub **`AuctionHub`** en `/auctionHub`:

* **Suscripción a grupos:** Los clientes invocan `JoinAuctionGroup(auctionId)` al ingresar y `LeaveAuctionGroup(auctionId)` al salir.
* **Eventos Emitidos por el Servidor:**
  * `ReceiveBid`: Notifica a todos los postores de la sala sobre una nueva puja aceptada (`auctionId`, `bidderId`, `amount`, `timestamp`).
  * `AuctionExtended`: Notifica la extensión de tiempo por regla anti-sniping.
  * `AuctionClosed`: Notifica a los participantes cuando el Background Worker finaliza la subasta y declara al ganador.

---

## 9. Procesos en Segundo Plano (Background Worker)

El servicio `AuctionClosingWorker` (`IHostedService`) se ejecuta de manera continua en segundo plano cada **10 segundos**:

1. Identifica subastas en estado `Active` cuya fecha de finalización ya expiró (`EndTime <= DateTime.UtcNow`).
2. **Subasta con ofertas:**
   * Selecciona la puja más alta registrada.
   * Ejecuta `WalletService.SettleAuctionAsync` en una transacción atómica: debita el saldo retenido y total del comprador ganador (`Debit`) y acredita el monto al saldo total del vendedor (`Credit`).
   * Cambia el estado de la subasta a `Closed`.
   * Registra el evento en `AuditLogs` con acción `AuctionClosed_WithWinner`.
   * Notifica a los clientes conectados vía SignalR.
3. **Subasta sin ofertas:**
   * Cambia el estado a `Closed` (desierta) sin movimientos monetarios.
   * Registra auditoría con acción `AuctionClosed_NoBids`.

---

## 10. Control de Concurrencia Optimista y Prueba de Estrés

### 10.1 Mecanismo de Concurrencia
Para garantizar la integridad ante múltiples postores ofertando al mismo milisegundo:
* La entidad `Auction` incluye una columna de concurrencia `[Timestamp] public byte[] Version { get; set; }`.
* Cuando dos o más transacciones concurrentes intentan actualizar la misma subasta con la misma versión leída, MySQL y EF Core detectan la colisión y arrojan `DbUpdateConcurrencyException`.
* El `GlobalExceptionMiddleware` intercepta la excepción y responde al cliente perdedor con un código de estado **`HTTP 409 Conflict`** bajo el estándar **RFC 7807 (ProblemDetails)**:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflicto de Concurrencia",
  "status": 409,
  "detail": "Otra transacción o puja fue procesada simultáneamente. Por favor, reintente la operación.",
  "instance": "/api/auctions/1/bids"
}
```

---

### 10.2 Ejecución del Test de Concurrencia Automatizado (Pytest)

El repositorio incluye una suite automatizada de pruebas de estrés en `tests/test_section2_concurrency.py` que dispara **10 peticiones HTTP asíncronas paralelas en el mismo milisegundo** contra el endpoint `POST /api/auctions/1/bids`:

#### Pasos para ejecutar la prueba:
1. Asegurarse de tener el backend corriendo en `http://localhost:5110`.
2. Instalar las dependencias de prueba (en una terminal separada):
   ```powershell
   pip install pytest httpx pytest-asyncio
   ```
3. Ejecutar el test de concurrencia:
   ```powershell
   pytest tests/test_section2_concurrency.py -v -s
   ```

#### 📊 Evidencia de Resultado Esperado:
```text
================================================================================
 PRUEBA DE CONCURRENCIA OPTIMISTA (RACE CONDITION) - POST /api/Auctions/1/bids
================================================================================
🚀 Disparando 10 peticiones de puja en paralelo al mismo milisegundo...
   - Subasta ID: #1
   - Monto a pujar: $50,000.00
   - Usuario: comprador2@test.com
--------------------------------------------------------------------------------
📊 Resultados de las 10 peticiones concurrentes:
   Petición #01: Status HTTP 200 | Respuesta: {"success":true,"amount":50000}
   Petición #02: Status HTTP 409 | Respuesta: {"type":"https://tools.ietf.org/html/rfc7231#section-6.5.8","title":"Conflicto de Concurrencia"...}
   Petición #03: Status HTTP 409 | Respuesta: {"type":"https://tools.ietf.org/html/rfc7231#section-6.5.8","title":"Conflicto de Concurrencia"...}
   ...
   Petición #10: Status HTTP 409 | Respuesta: {"type":"https://tools.ietf.org/html/rfc7231#section-6.5.8","title":"Conflicto de Concurrencia"...}
--------------------------------------------------------------------------------
✅ Peticiones Aceptadas (HTTP 200/201): 1 (Esperado: 1)
🛑 Peticiones Rechazadas (HTTP 409 Conflict): 9 (Esperado: 9)
================================================================================
PASSED [100%]
```

---

## 11. Matriz de Cumplimiento de Requisitos

| Eje Evaluativo | Requisito Académico | Estado | Implementación en SubastaYa |
| :--- | :--- | :---: | :--- |
| **Frontend & UX** | Catálogo con filtros y búsqueda | ✅ | `AuctionFilter.jsx`, `AuctionGrid.jsx` (búsqueda, estado, categoría y orden). |
| | Tarjetas con contador regresivo | ✅ | `AuctionCard.jsx` con cuenta regresiva dinámica en vivo. |
| | Formulario de publicación y validaciones | ✅ | `CreateAuctionPage.jsx` con previsualización en tiempo real. |
| | Sala en vivo y consola de pujas | ✅ | `AuctionDetailPage.jsx`, `BidConsole.jsx` con sugerencia automática de incremento. |
| | Billetera: Total, Retenido y Disponible | ✅ | `WalletPage.jsx` y `WalletContext.jsx` con tres métricas financieras. |
| | Panel de Usuario: Publicaciones | ✅ | `ProfilePage.jsx` conectado a `GET /api/auctions/my-publications`. |
| **Dominio & Negocio** | Custodia de Fondos (Escrow) | ✅ | `WalletService.ReplaceHoldAsync` con bloqueo y liberación atómica. |
| | Regla Anti-Sniping (< 60s -> +2 min) | ✅ | `PlaceBidUseCase.cs` (+2 min automáticos y registro en `AuditLogs`). |
| | Liquidación Background Worker | ✅ | `AuctionClosingWorker.cs` cada 10s liquidando saldo del ganador al vendedor. |
| | Libro Mayor Contable (Ledger) | ✅ | `TransactionLedger` auditando `Deposit`, `Hold`, `Release`, `Debit` y `Credit`. |
| | Registro de Auditoría (Audit Log) | ✅ | Tabla `AuditLogs` inmutable para eventos críticos del sistema. |
| **Arquitectura & BD** | Code-First con Migraciones | ✅ | Entity Framework Core 8 con snapshot y migraciones en MySQL. |
| | Optimistic Locking | ✅ | Columna `Version` `[Timestamp]` en `Auction` y `Wallet`. |
| | Manejo de Concurrencia (409 Conflict) | ✅ | `GlobalExceptionMiddleware` con estándar RFC 7807 ProblemDetails. |
| | WebSockets / Tiempo Real | ✅ | ASP.NET Core SignalR (`AuctionHub`) integrado con frontend. |
| | OpenAPI / Swagger | ✅ | Swagger UI configurado en `/swagger` con autenticación Bearer JWT. |
| | Suite de Pruebas de Estrés | ✅ | Pruebas asíncronas concurrentes con Pytest en `tests/`. |

---

## 12. Autores y Datos de la Entrega

* **Asignatura:** Proyecto de Software
* **Desarrolladores:**
  * **Santiago Bruno**
  * **Ariel Carriego**
* **Año Académico:** 2026
