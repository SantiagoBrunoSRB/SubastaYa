using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using SubastaYa.Api.Application.DTOs.Auth;
using SubastaYa.Api.Application.Interfaces.Services;
using SubastaYa.Api.Domain.Exceptions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SubastaYa.Api.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<IdentityUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new DomainException("Credenciales inválidas.");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Token = token,
            Email = user.Email ?? string.Empty
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var user = new IdentityUser { UserName = request.Email, Email = request.Email };
        
        var result = await _userManager.CreateAsync(user, request.Password);
        
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new DomainException($"Error al crear usuario: {errors}");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Token = token,
            Email = user.Email ?? string.Empty
        };
    }

    private string GenerateJwtToken(IdentityUser user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var keyString = jwtSettings["Key"] ?? throw new InvalidOperationException("Falta Jwt:Key en appsettings.json");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id), // Claim requerido para buscar por id (ej: User.FindFirstValue(ClaimTypes.NameIdentifier))
            new Claim(ClaimTypes.Email, user.Email!)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7), // El token expira en 7 días
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
