# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyectos para aprovechar cache de capas en restore
COPY SubastaYa.sln ./
COPY SubastaYa.Api/SubastaYa.Api.csproj SubastaYa.Api/
COPY SubastaYa.Application/SubastaYa.Application.csproj SubastaYa.Application/
COPY SubastaYa.Domain/SubastaYa.Domain.csproj SubastaYa.Domain/
COPY SubastaYa.Infrastructure/SubastaYa.Infrastructure.csproj SubastaYa.Infrastructure/

RUN dotnet restore SubastaYa.Api/SubastaYa.Api.csproj

# Copiar todo el código restante y compilar
COPY . .
WORKDIR /src/SubastaYa.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SubastaYa.Api.dll"]

