using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Application.Interfaces;
using SubastaYa.Api.Application.Services;
using SubastaYa.Api.Infrastructure.BackgroundServices;
using SubastaYa.Api.Infrastructure.Data;
using SubastaYa.Api.Infrastructure.Repositories;
using SubastaYa.Api.Presentation.Hubs;

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

// 4. Background Services (Workers en segundo plano)
builder.Services.AddHostedService<AuctionClosingWorker>();

// 5. Configuracion de CORS
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

// 6. Agregar SignalR (WebSockets)
builder.Services.AddSignalR();

// 7. Agregar Controladores
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configuracion del pipeline HTTP
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

app.MapControllers();

// Mapeo del Hub de SignalR para WebSockets en tiempo real
app.MapHub<AuctionHub>("/auctionHub");

app.Run();
