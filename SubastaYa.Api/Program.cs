using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Application.Interfaces.Persistence;
using SubastaYa.Api.Application.Services;
using SubastaYa.Api.Application.UseCases.Auctions.CreateAuction;
using SubastaYa.Api.Application.UseCases.Auctions.GetAuctions;
using SubastaYa.Api.Application.UseCases.Bids.PlaceBid;
using SubastaYa.Api.Infrastructure.BackgroundServices;
using SubastaYa.Api.Infrastructure.Data;
using SubastaYa.Api.Infrastructure.Data.Seeder;
using SubastaYa.Api.Infrastructure.Repositories;
using SubastaYa.Api.Presentation.Hubs;
using SubastaYa.Api.Presentation.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuracion de la Base de Datos MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. Configuracion de Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// 3. Inyeccion de Dependencias - Modulo Billetera y Servicios
builder.Services.AddScoped<IWalletRepository, WalletRepository>();
builder.Services.AddScoped<IWalletService, WalletService>();

// 4. Inyeccion de Dependencias - Modulo Subastas y Pujas (Dev A)
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuctionRepository, AuctionRepository>();
builder.Services.AddScoped<IBidRepository, BidRepository>();

// Casos de Uso Subastas
builder.Services.AddScoped<CreateAuctionUseCase>();
builder.Services.AddScoped<GetAuctionsUseCase>();
builder.Services.AddScoped<PlaceBidUseCase>();

// 5. Background Services (Workers en segundo plano)
builder.Services.AddHostedService<AuctionClosingWorker>();

// 6. Configuracion de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500") // URL del frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Para SignalR y Cookies
    });
});

// 7. Agregar SignalR (WebSockets)
builder.Services.AddSignalR();

// 8. Agregar Controladores y Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configuracion del pipeline HTTP
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS ANTES de Authentication y Authorization
app.UseCors("FrontendCors");

app.UseAuthentication();
app.UseAuthorization();

// Ejecutar siembra de datos semilla en base de datos al iniciar la app
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        await DbSeeder.SeedAsync(context, userManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al ejecutar la siembra de datos semilla.");
    }
}

app.MapControllers();
app.MapHub<AuctionHub>("/auctionHub");

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DataSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al sembrar la base de datos.");
    }
}

app.Run();
