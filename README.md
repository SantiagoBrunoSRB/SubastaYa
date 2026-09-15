# SubastaYa 

**SubastaYa** es una plataforma web de subastas en tiempo real y comercio electrónico diseñada para garantizar la confianza, solvencia y un juego limpio en las transacciones. El sistema incorpora una billetera virtual con mecanismo de garantía (Escrow) y reglas automáticas *anti-sniping* para asegurar la transparencia en las pujas.

Desarrollada en **.NET 8 (C#)** y **MySQL (EF Core)** bajo una arquitectura limpia (Vertical Slicing / Hexagonal), y con WebSockets vía **SignalR** para la sincronización en tiempo real.

---

## Características Principales

### 1. Billetera Virtual y Sistema de Escrow
Toda puja debe estar respaldada por saldo real. 
- **Escrow Automático:** Al realizar una puja, el monto se retiene (congelado en garantía).
- **Liberación Atómica:** Si un usuario es superado, sus fondos retenidos se liberan instantáneamente y los del nuevo líder se bloquean en una única transacción atómica.

### 2. Sala de Subasta en Vivo (SignalR)
- **WebSockets en Tiempo Real:** Las pujas y el temporizador se actualizan instantáneamente sin necesidad de recargar la página.
- **Temporizador Dinámico:** Alerta visual en la zona crítica (último minuto).

### 3. Juego Limpio (Regla Anti-Sniping)
Para evitar que bots o usuarios roben la subasta en el último segundo, si se recibe una oferta válida dentro de los últimos **60 segundos** de la subasta, el tiempo límite se extiende automáticamente por **2 minutos adicionales**.

### 4. Adjudicación en Segundo Plano (Worker)
Un proceso automático (Background Worker) revisa periódicamente las subastas expiradas:
- Liquida los fondos: transfiere el saldo retenido del ganador al vendedor.
- Cambia estados (a `Finalizada` o `Desierta`).
- Registra logs de auditoría de forma inmutable.

### 5. Trazabilidad y Auditoría
Todas las acciones críticas (cambios de estado, extensiones de tiempo, pujas rechazadas, cargas de saldo) quedan registradas en una tabla de `AuditLogs` para garantizar la transparencia.

---

## Pila Tecnológica

* **Backend:** ASP.NET Core Web API (.NET 8)
* **Base de Datos:** MySQL
* **ORM:** Entity Framework Core (`Pomelo.EntityFrameworkCore.MySql`)
* **Identidad y Seguridad:** ASP.NET Core Identity
* **Comunicación en Tiempo Real:** SignalR (WebSockets)
* **Arquitectura:** Domain-Driven Design (Core inyectado por interfaces) y Patrón REST Nivel 2.
* **Control de Concurrencia:** Optimistic Locking (campo `Version`) para evitar condiciones de carrera.

---

## Estructura del Proyecto

El backend está organizado en un único proyecto físico con separación lógica mediante carpetas:

```text
SubastaYa.sln
└── SubastaYa.Api/
    ├── Domain/               (Core: Entidades, Enums, Excepciones - Sin dependencias externas)
    ├── Application/          (Casos de Uso, DTOs, Interfaces como IRepository / IUnitOfWork)
    ├── Infrastructure/       (Detalles Técnicos: AppDbContext, Repositorios, Background Worker)
    └── Presentation/         (Controladores REST, SignalR Hubs, Middleware de Excepciones)
```

---

## Guía de Instalación y Ejecución

### Prerrequisitos
* **.NET SDK:** 8.0+
* **Motor de Base de Datos:** MySQL (Ej. XAMPP, MariaDB, Docker) corriendo en el puerto `3306`.

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/SantiagoBrunoSRB/SubastaYa.git
   cd SubastaYa/SubastaYa.Api
   ```

2. **Configurar la Base de Datos:**
   Asegúrate de que tu instancia de MySQL esté corriendo. Revisa la cadena de conexión en `appsettings.Development.json` (por defecto apunta a `Database=SubastaYaDb`).

3. **Restaurar dependencias y compilar:**
   ```powershell
   dotnet build
   ```

4. **Aplicar Migraciones (Code-First):**
   El esquema relacional, junto con los datos semilla (usuarios de prueba y subastas pre-cargadas), se generará automáticamente.
   ```powershell
   dotnet ef database update
   ```

5. **Ejecutar la API:**
   ```powershell
   dotnet run --launch-profile "http"
   ```

### Accesos Directos
* **Swagger UI (Documentación API):** `http://localhost:5110/swagger`
* **SignalR Endpoint (WebSockets):** `http://localhost:5110/auctionHub`

---

##  Pruebas de Concurrencia (Stress Test)
El sistema está diseñado para soportar solicitudes concurrentes al pujar, utilizando Optimistic Locking. 
Si dos usuarios intentan pujar al mismo exacto milisegundo sobre la misma versión de la subasta, solo uno tendrá éxito, mientras que el otro recibirá una respuesta HTTP `409 Conflict`, obligando al cliente a actualizar el estado visual antes de volver a intentar.

---

##  Datos Semilla Incluidos (Testing Rápido)
Al ejecutar las migraciones, se crearán usuarios útiles para pruebas:
- `vendedor@test.com` (Creador de subastas)
- `comprador1@test.com` (Postor con saldo retenido)
- `comprador2@test.com` (Postor con saldo disponible)
- `sinfondos@test.com` (Usuario para probar validación de billetera vacía)
