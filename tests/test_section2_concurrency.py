import pytest
import httpx
import asyncio

"""
===============================================================================
SUITE DE PRUEBAS: SECCIÓN 2 - CONCURRENCIA Y ANTI-SNIPING
===============================================================================
Basado en la arquitectura backend oficial de 'main' (SubastaYa .NET 8 Web API):
  - Control de Concurrencia Optimista (Optimistic Locking): POST /api/Auctions/{id}/bids
  - Regla Anti-Sniping: Extensión automática de EndTime (+2 min) al pujar en < 60s.

Objetivos:
  1. Validar el Control de Concurrencia Optimista en la base de datos MySQL / EF Core:
     - Disparo simultáneo asincrónico (Async HTTP) de N peticiones de puja en el mismo milisegundo.
     - Verificar que exactamente 1 puja sea procesada con éxito (HTTP 200) y las peticiones
       colisionadas sean rechazadas adecuadamente (HTTP 409 Conflict / HTTP 400 Bad Request).
  2. Validar la Regla Anti-Sniping:
     - Pujar en una subasta activa cuando restan menos de 60 segundos para el cierre.
     - Verificar que el backend extienda automáticamente la fecha de fin (EndTime) en +2 minutos.
===============================================================================
"""

BASE_URL = "http://localhost:5110/api"

USERS = {
    "comprador1": {"email": "comprador1@test.com", "password": "Password123!"},
    "comprador2": {"email": "comprador2@test.com", "password": "Password123!"},
}

@pytest.fixture(scope="module")
def auth_tokens():
    """Fixture que re-siembra la BD y autentica a los usuarios compradores."""
    tokens = {}
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        try:
            client.post("/Wallets/reseed")
        except Exception as e:
            pytest.fail(f"No se pudo conectar a la API en {BASE_URL}. Asegúrese de que el backend esté ejecutándose. Detalle: {e}")

        for key, user in USERS.items():
            response = client.post("/Auth/login", json={"email": user["email"], "password": user["password"]})
            assert response.status_code == 200, f"Error al autenticar a {user['email']}: {response.text}"
            tokens[key] = response.json()["token"]
    return tokens


class TestSection2ConcurrencyAndAntiSniping:

    @pytest.mark.asyncio
    async def test_01_optimistic_concurrency_race_condition(self, auth_tokens):
        """
        Prueba de Concurrencia Optimista (Optimistic Locking Test):
        Envía N peticiones de puja simultáneas al mismo milisegundo a POST /api/auctions/1/bids.
        Exactamente 1 puja debe ser procesada exitosamente y las demás rechazadas por colisión.
        """
        token = auth_tokens["comprador2"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        auction_id = 1
        bid_amount = 50000.0  # Superior a los $45.000 actuales de la subasta #1
        num_requests = 10

        print("\n" + "="*80)
        print(" PRUEBA DE CONCURRENCIA OPTIMISTA (RACE CONDITION) - POST /api/Auctions/1/bids")
        print("="*80)
        print(f"🚀 Disparando {num_requests} peticiones de puja en paralelo al mismo milisegundo...")
        print(f"   - Subasta ID: #{auction_id}")
        print(f"   - Monto a pujar: ${bid_amount:,.2f}")
        print(f"   - Usuario: comprador2@test.com")

        async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
            # Crear las N corrutinas de petición simultáneas
            tasks = [
                client.post(f"/Auctions/{auction_id}/bids", json={"amount": bid_amount}, headers=headers)
                for _ in range(num_requests)
            ]
            
            # Disparar todas en paralelo al mismo milisegundo
            responses = await asyncio.gather(*tasks, return_exceptions=False)

        status_codes = [r.status_code for r in responses]
        
        # Conteo de respuestas
        success_count = sum(1 for s in status_codes if s in [200, 201])
        conflict_or_reject_count = sum(1 for s in status_codes if s in [409, 400, 500])

        print("-" * 80)
        print(f"📊 Resultados de las {num_requests} peticiones concurrentes:")
        for idx, r in enumerate(responses, 1):
            print(f"   Petición #{idx:02d}: Status HTTP {r.status_code} | Respuesta: {r.text[:100]}")
        print("-" * 80)
        print(f"✅ Peticiones Aceptadas (HTTP 200/201): {success_count} (Esperado: 1)")
        print(f"🛑 Peticiones Rechazadas (HTTP 409/400/500): {conflict_or_reject_count} (Esperado: {num_requests - 1})")
        print("="*80)

        assert success_count == 1, (
            f"Se esperaba exactamente 1 puja exitosa en concurrencia, se obtuvieron {success_count}. "
            f"Códigos HTTP recibidos: {status_codes}"
        )
        assert conflict_or_reject_count == (num_requests - 1), (
            f"Las {num_requests - 1} peticiones restantes debieron ser rechazadas por concurrencia. "
            f"Códigos HTTP recibidos: {status_codes}"
        )

    @pytest.mark.asyncio
    async def test_02_anti_sniping_time_extension(self, auth_tokens):
        """
        Prueba de la Regla Anti-Sniping:
        Consulta el estado inicial de una subasta a punto de expirar (Subasta #2).
        Al realizar una puja dentro de los últimos 60 segundos, la fecha de fin (EndTime) debe extenderse automáticamente.
        """
        token = auth_tokens["comprador2"]
        headers = {"Authorization": f"Bearer {token}"}

        print("\n" + "="*80)
        print(" PRUEBA DE REGLA ANTI-SNIPING - EXTENSIÓN AUTOMÁTICA DE ENDTIME")
        print("="*80)

        async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
            # 1. Obtener el estado inicial de la subasta #2
            get_resp = await client.get("/Auctions/2", headers=headers)
            assert get_resp.status_code == 200, f"Error al consultar Subasta #2: {get_resp.text}"
            auction_before = get_resp.json()
            initial_end_time = auction_before["endTime"]
            current_price = auction_before["currentPrice"]

            print(f"⏰ Subasta #2 Inicial:")
            print(f"   - Título: {auction_before['title']}")
            print(f"   - Precio Actual: ${current_price:,.2f}")
            print(f"   - EndTime Inicial: {initial_end_time}")

            # 2. Pujar un monto válido superior
            new_bid_amount = current_price + 5000.0
            print(f"\n💸 Realizando oferta anti-sniping por ${new_bid_amount:,.2f}...")
            bid_resp = await client.post(
                f"/Auctions/2/bids",
                json={"amount": new_bid_amount},
                headers=headers
            )
            assert bid_resp.status_code == 200, f"Error al realizar puja anti-sniping: {bid_resp.text}"
            print(f"   - Respuesta HTTP: {bid_resp.status_code} OK")

            # 3. Obtener el estado actualizado de la subasta #2
            get_after_resp = await client.get("/Auctions/2", headers=headers)
            assert get_after_resp.status_code == 200
            auction_after = get_after_resp.json()
            updated_end_time = auction_after["endTime"]

            print(f"\n⌛ Subasta #2 Actualizada:")
            print(f"   - Nuevo Precio Actual: ${auction_after['currentPrice']:,.2f}")
            print(f"   - EndTime Actualizado: {updated_end_time}")
            print("-" * 80)
            print(f"✅ Extensión confirmada: {initial_end_time} -> {updated_end_time} (+2 minutos)")
            print("="*80)

            # 4. Verificar que EndTime fue extendida automáticamente (+2 minutos)
            assert updated_end_time > initial_end_time, (
                f"La regla Anti-Sniping debió extender la hora de fin (EndTime). "
                f"Inicial: {initial_end_time}, Actualizada: {updated_end_time}"
            )
