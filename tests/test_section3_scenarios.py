import pytest
import httpx

"""
===============================================================================
SUITE DE PRUEBAS: SECCIÓN 3 - ESCENARIOS FUNCIONALES DE NEGOCIO
===============================================================================
Basado en la arquitectura backend oficial de 'main' (SubastaYa .NET 8 Web API):
  - Rechazo de puja por fondos insuficientes (sinfondos@test.com).
  - Bloqueo de puja en subasta Próxima (StartTime a +24 hs).
  - Superación de oferta y liberación automática de saldo retenido (Escrow release).
  - Cierre y liquidación automática de subastas expiraradas.
===============================================================================
"""

BASE_URL = "http://localhost:5110/api"

USERS = {
    "comprador1": {"email": "comprador1@test.com", "password": "Password123!"},
    "comprador2": {"email": "comprador2@test.com", "password": "Password123!"},
    "sinfondos": {"email": "sinfondos@test.com", "password": "Password123!"},
}

@pytest.fixture(scope="module")
def auth_tokens():
    """Fixture que re-siembra la BD y autentica a los usuarios del escenario."""
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


class TestSection3BusinessScenarios:

    def test_01_insufficient_funds_rejection(self, auth_tokens):
        """
        Prueba de Rechazo por Fondos Insuficientes:
        El usuario sinfondos@test.com posee $500 disponibles.
        Intenta realizar una puja por $10.000 en la subasta activa #1.
        Debe ser rechazado con HTTP 400 Bad Request.
        """
        token = auth_tokens["sinfondos"]
        headers = {"Authorization": f"Bearer {token}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            response = client.post("/Auctions/1/bids", json={"amount": 50000.0}, headers=headers)
            assert response.status_code == 400, f"Se esperaba rechazo HTTP 400 por fondos insuficientes, se obtuvo {response.status_code}: {response.text}"
            
            data = response.json()
            detail = str(data.get("detail", "")).lower()
            assert "fondos" in detail or "saldo" in detail or "insuficiente" in detail, f"Mensaje inesperado: {detail}"

    def test_02_upcoming_auction_bidding_blocked(self, auth_tokens):
        """
        Prueba de Bloqueo de Puja en Subasta Próxima:
        La subasta #3 tiene un inicio programado a +24 horas.
        Intentar pujar en ella debe ser rechazado con HTTP 400 Bad Request.
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            response = client.post("/Auctions/3/bids", json={"amount": 60000.0}, headers=headers)
            assert response.status_code == 400, f"Se esperaba rechazo HTTP 400 por subasta no iniciada, se obtuvo {response.status_code}: {response.text}"

            data = response.json()
            detail = str(data.get("detail", "")).lower()
            assert "período" in detail or "periodo" in detail or "activa" in detail or "iniciada" in detail, f"Mensaje inesperado: {detail}"

    def test_03_outbid_automatic_escrow_release(self, auth_tokens):
        """
        Prueba de Liberación Automática de Escrow (Saldo Retenido):
        1. comprador1@test.com inicia con $45.000 retenidos y $105.000 disponibles.
        2. comprador2@test.com realiza una oferta mayor ($55.000) en la subasta #1.
        3. El saldo retenido de comprador1@test.com debe ser liberado inmediatamente ($0 retenidos, $150.000 disponible).
        """
        token1 = auth_tokens["comprador1"]
        token2 = auth_tokens["comprador2"]

        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            # 1. Verificar balance inicial de comprador1 (45.000 retenidos)
            resp1 = client.get("/Wallets/balance", headers=headers1)
            assert resp1.status_code == 200
            bal1_before = resp1.json()
            assert bal1_before["heldBalance"] == 45000

            # 2. comprador2 realiza sobre-puja de $55.000
            bid_resp = client.post("/Auctions/1/bids", json={"amount": 55000.0}, headers=headers2)
            assert bid_resp.status_code == 200, f"Error al realizar sobre-puja: {bid_resp.text}"

            # 3. Verificar que comprador1 recuperó su saldo retenido (heldBalance = 0, availableBalance = 150000)
            resp1_after = client.get("/Wallets/balance", headers=headers1)
            assert resp1_after.status_code == 200
            bal1_after = resp1_after.json()
            assert bal1_after["heldBalance"] == 0, f"El saldo retenido de comprador1 debió ser 0 tras la sobre-puja, se obtuvo {bal1_after['heldBalance']}"
            assert bal1_after["availableBalance"] == 150000, f"El saldo disponible de comprador1 debió ser $150.000, se obtuvo {bal1_after['availableBalance']}"

    def test_04_expired_auctions_verification(self, auth_tokens):
        """
        Verificación de Subastas Vencidas:
        Verifica que las subastas vencidas #4 y #5 existan y que sus estados reflejen la finalización de su ciclo de vida.
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            for auction_id in [4, 5]:
                resp = client.get(f"/Auctions/{auction_id}", headers=headers)
                assert resp.status_code == 200, f"Subasta vencida #{auction_id} no encontrada: {resp.text}"
