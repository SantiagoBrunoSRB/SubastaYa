using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Api.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuracion de la Base de Datos MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. Configuracion de Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// 3. Configuracion de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500") // URL del frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Aqui se usa SignalR o Cookies
    });
});

// 4. Agregar SignalR (WebSockets)
builder.Services.AddSignalR();

// 5. Agregar Controladores
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
// Mapear Hub de SignalR (cuando se cree en Presentation/Hubs)
// app.MapHub<AuctionHub>("/auctionHub");

app.Run();
