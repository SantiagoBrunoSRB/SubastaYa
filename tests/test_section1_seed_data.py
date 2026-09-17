import pytest
import httpx

"""
===============================================================================
SUITE DE PRUEBAS: SECCIÓN 1 - DATOS SEMILLA OBLIGATORIOS (SEED DATA)
===============================================================================
Objetivo: Validar que el sistema inicie en un estado conocido y reproducible,
verificando la presencia de los 4 usuarios con sus saldos exactos (Total, Retenido/Held,
Disponible), las subastas sembradas en el catálogo, el historial de pujas
previas y los registros contables en el libro mayor (TransactionLedger).
===============================================================================
"""

BASE_URL = "http://localhost:5110/api"

# Credenciales de los 4 usuarios semilla exigidos
USERS = {
    "vendedor": {"email": "vendedor@test.com", "password": "Password123!"},
    "comprador1": {"email": "comprador1@test.com", "password": "Password123!"},
    "comprador2": {"email": "comprador2@test.com", "password": "Password123!"},
    "sinfondos": {"email": "sinfondos@test.com", "password": "Password123!"},
}

@pytest.fixture(scope="module")
def auth_tokens():
    """Fixture que re-siembra la base de datos a su estado inicial, inicia sesión con los 4 usuarios semilla y devuelve sus JWT Tokens."""
    tokens = {}
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # Re-sembrar base de datos para garantizar estado semilla puro
        client.post("/Wallets/reseed")

        for key, user in USERS.items():
            response = client.post("/Auth/login", json={"email": user["email"], "password": user["password"]})
            assert response.status_code == 200, f"Error al autenticar a {user['email']}: {response.text}"
            data = response.json()
            assert "token" in data, f"No se recibió token para {user['email']}"
            tokens[key] = data["token"]
    return tokens


class TestSection1SeedData:

    def test_01_verify_wallets_initial_state(self, auth_tokens):
        """
        Verifica que las billeteras de los 4 usuarios contengan las métricas financieras exactas:
        - vendedor@test.com: Total $0 / Retenido $0 / Disponible $0.
        - comprador1@test.com: Total $150.000 / Retenido $45.000 / Disponible $105.000.
        - comprador2@test.com: Total $200.000 / Retenido $0 / Disponible $200.000.
        - sinfondos@test.com: Total $500 / Retenido $0 / Disponible $500.
        """
        expected_balances = {
            "vendedor": {"total": 0, "held": 0, "available": 0},
            "comprador1": {"total": 150000, "held": 45000, "available": 105000},
            "comprador2": {"total": 200000, "held": 0, "available": 200000},
            "sinfondos": {"total": 500, "held": 0, "available": 500},
        }

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            for user_key, expected in expected_balances.items():
                token = auth_tokens[user_key]
                headers = {"Authorization": f"Bearer {token}"}

                response = client.get("/Wallets/balance", headers=headers)
                assert response.status_code == 200, f"Fallo al obtener balance para {user_key}: {response.text}"

                data = response.json()
                assert data["totalBalance"] == expected["total"], f"TotalBalance incorrecto para {user_key}"
                assert data["heldBalance"] == expected["held"], f"HeldBalance incorrecto para {user_key}"
                assert data["availableBalance"] == expected["available"], f"AvailableBalance incorrecto para {user_key}"

    def test_02_verify_auctions_catalog_initial_state(self, auth_tokens):
        """
        Verifica que el catálogo devuelva las subastas en su estado inicial.
        - GET /Auctions devuelve las subastas activas (al menos 2 o 3 activas según el tiempo).
        - GET /Auctions/{id} confirma la existencia de las subastas semilla creadas.
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            # 1. Catálogo activo
            response = client.get("/Auctions", headers=headers)
            assert response.status_code == 200, f"Error al consultar /Auctions: {response.text}"
            active_auctions = response.json()
            assert isinstance(active_auctions, list), "El catálogo debe devolver una lista de subastas."
            assert len(active_auctions) >= 2, f"Se esperaban al menos subastas activas en catálogo, se encontraron {len(active_auctions)}"

            # 2. Verificar existencia individual de las subastas sembradas
            for auction_id in range(1, 4):
                resp = client.get(f"/Auctions/{auction_id}", headers=headers)
                assert resp.status_code == 200, f"Subasta #{auction_id} no encontrada: {resp.text}"

    def test_03_verify_active_auction_bids_history(self, auth_tokens):
        """
        Verifica que la Subasta Activa Estándar (ID #1) contenga las 2 pujas previas cargadas,
        con el comprador1@test.com como líder en $45.000.
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            response = client.get("/Auctions/1", headers=headers)
            assert response.status_code == 200, f"Error al obtener detalle de Subasta 1: {response.text}"

            auction = response.json()
            assert auction["currentPrice"] == 45000, f"El precio actual debe ser $45.000, obtenido {auction['currentPrice']}"

            bids = auction.get("bids", [])
            assert len(bids) >= 2, f"Se esperaban al menos 2 pujas previas en la subasta activa, encontradas {len(bids)}"

    def test_04_verify_transaction_ledger_initial_records(self, auth_tokens):
        """
        Verifica los registros contables en el libro mayor (TransactionLedger) para comprador1@test.com,
        confirmando que existan el depósito inicial y el saldo retenido de $45.000 (Hold).
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            response = client.get("/Wallets/transactions", headers=headers)
            assert response.status_code == 200, f"Error al consultar transacciones de comprador1: {response.text}"

            transactions = response.json()
            assert isinstance(transactions, list), "Las transacciones deben ser una lista."

            # Verificar presencia de transacción tipo Hold de 45.000
            hold_txs = [t for t in transactions if str(t.get("type")).lower() == "hold" and t.get("amount") == 45000]
            assert len(hold_txs) > 0, f"No se encontró el registro de retención (Hold) de $45.000 en el libro mayor. Transacciones encontradas: {transactions}"
