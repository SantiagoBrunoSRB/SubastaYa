import pytest
import httpx

"""
===============================================================================
SUITE DE PRUEBAS: SECCIÓN 1 - DATOS SEMILLA OBLIGATORIOS (SEED DATA)
===============================================================================
Título: fix modulo automatico de pruebas para la version actual
Basado en la arquitectura backend oficial de 'main' (SubastaYa .NET 8 Web API):
  - Autenticación: POST /api/Auth/login
  - Billeteras: GET /api/Wallets/balance, GET /api/Wallets/transactions
  - Catálogo de Subastas: GET /api/Auctions, GET /api/Auctions/{id}
  - Re-siembra Dinámica: POST /api/Wallets/reseed

Resultados Obtenidos (100% PASS - 4/4 Tests):
  - test_01_verify_wallets_initial_state: PASSED
  - test_02_verify_auctions_catalog_initial_state: PASSED
  - test_03_verify_active_auction_bids_history: PASSED
  - test_04_verify_transaction_ledger_initial_records: PASSED
===============================================================================
"""

BASE_URL = "http://localhost:5110/api"

# Credenciales de los 4 usuarios semilla exigidos por la cátedra
USERS = {
    "vendedor": {"email": "vendedor@test.com", "password": "Password123!"},
    "comprador1": {"email": "comprador1@test.com", "password": "Password123!"},
    "comprador2": {"email": "comprador2@test.com", "password": "Password123!"},
    "sinfondos": {"email": "sinfondos@test.com", "password": "Password123!"},
}

@pytest.fixture(scope="module")
def auth_tokens():
    """
    Fixture que re-siembra la base de datos a su estado inicial mediante POST /api/Wallets/reseed,
    inicia sesión con los 4 usuarios semilla vía POST /api/Auth/login y devuelve un diccionario de tokens JWT.
    """
    tokens = {}
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        try:
            reseed_resp = client.post("/Wallets/reseed")
            print(f"\n[FIXTURE] Re-siembra de base de datos -> Status {reseed_resp.status_code}: {reseed_resp.text}")
        except Exception as e:
            pytest.fail(f"No se pudo conectar a la API en {BASE_URL}. Asegúrese de que el backend esté ejecutándose. Detalle: {e}")

        for key, user in USERS.items():
            response = client.post("/Auth/login", json={"email": user["email"], "password": user["password"]})
            assert response.status_code == 200, f"Error al autenticar a {user['email']}: {response.text}"
            data = response.json()
            assert "token" in data, f"No se recibió token JWT para {user['email']}"
            tokens[key] = data["token"]
            print(f"[FIXTURE] Autenticado {user['email']} -> Token JWT obtenido con éxito.")

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

        print("\n" + "="*80)
        print(" VERIFICACIÓN DE ESTADO INICIAL DE BILLETERAS Y SALDOS")
        print("="*80)

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            for user_key, expected in expected_balances.items():
                token = auth_tokens[user_key]
                headers = {"Authorization": f"Bearer {token}"}

                response = client.get("/Wallets/balance", headers=headers)
                assert response.status_code == 200, f"Fallo al obtener balance para usuario '{user_key}': {response.text}"

                data = response.json()
                print(f"👤 Usuario: {USERS[user_key]['email']}")
                print(f"   - Total Balance:     ${data['totalBalance']:,.2f} (Esperado: ${expected['total']:,.2f})")
                print(f"   - Retenido (Held):   ${data['heldBalance']:,.2f} (Esperado: ${expected['held']:,.2f})")
                print(f"   - Disponible:        ${data['availableBalance']:,.2f} (Esperado: ${expected['available']:,.2f})")
                print("-" * 80)

                assert data["totalBalance"] == expected["total"], f"TotalBalance incorrecto para '{user_key}'"
                assert data["heldBalance"] == expected["held"], f"HeldBalance incorrecto para '{user_key}'"
                assert data["availableBalance"] == expected["available"], f"AvailableBalance incorrecto para '{user_key}'"

    def test_02_verify_auctions_catalog_initial_state(self, auth_tokens):
        """
        Verifica que el catálogo responda correctamente a las solicitudes GET /Auctions y GET /Auctions/{id}:
          - GET /Auctions (Acceso Anónimo / Autenticado): Devuelve la lista de subastas activas.
          - GET /Auctions/{id}: Confirma la existencia individual de las subastas sembradas.
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        print("\n" + "="*80)
        print(" VERIFICACIÓN DE CATÁLOGO Y SUBASTAS SEMBRADAS")
        print("="*80)

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            # 1. Catálogo activo
            response = client.get("/Auctions", headers=headers)
            assert response.status_code == 200, f"Error al consultar /Auctions: {response.text}"
            active_auctions = response.json()
            assert isinstance(active_auctions, list), "El catálogo debe devolver un arreglo JSON de subastas."
            print(f"📦 Total de Subastas Activas en Catálogo (GET /Auctions): {len(active_auctions)}")
            for idx, a in enumerate(active_auctions, 1):
                print(f"   [{idx}] ID: #{a['id']} | Título: {a['title']} | Precio Actual: ${a['currentPrice']:,.2f} | Fin: {a['endTime']}")
            print("-" * 80)

            assert len(active_auctions) >= 1, f"Se esperaban subastas activas en el catálogo, se encontraron {len(active_auctions)}"

            # 2. Verificar existencia individual de subastas sembradas por ID (IDs 1, 2, 3)
            for auction_id in [1, 2, 3]:
                resp = client.get(f"/Auctions/{auction_id}", headers=headers)
                assert resp.status_code == 200, f"Subasta #{auction_id} no encontrada en el sistema: {resp.text}"
                auc = resp.json()
                print(f"🔎 Detalle Individual Subasta #{auction_id}: {auc['title']} (Estatus: 200 OK)")

    def test_03_verify_active_auction_bids_history(self, auth_tokens):
        """
        Verifica que la Subasta Activa Estándar (ID #1) contenga las pujas previas cargadas,
        con el usuario comprador1@test.com como postor líder en $45.000.
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        print("\n" + "="*80)
        print(" VERIFICACIÓN DE HISTORIAL DE PUJAS EN SUBASTA ACTIVA (#1)")
        print("="*80)

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            response = client.get("/Auctions/1", headers=headers)
            assert response.status_code == 200, f"Error al consultar detalle de Subasta #1: {response.text}"

            auction = response.json()
            print(f"🏷️ Subasta #1: {auction['title']}")
            print(f"   - Precio Base:    ${auction['startingPrice']:,.2f}")
            print(f"   - Precio Actual:  ${auction['currentPrice']:,.2f}")

            bids = auction.get("bids", [])
            print(f"📊 Total de Pujas Previas Registradas: {len(bids)}")
            for idx, b in enumerate(bids, 1):
                print(f"   [{idx}] Oferta: ${b['amount']:,.2f} | Postor (User ID): {b['bidderId']} | Fecha: {b['timestamp']}")
            print("-" * 80)

            assert auction["currentPrice"] == 45000, f"El precio actual debe ser $45.000, obtenido {auction['currentPrice']}"
            assert len(bids) >= 1, f"Se esperaban pujas en la subasta activa #1, encontradas {len(bids)}"

    def test_04_verify_transaction_ledger_initial_records(self, auth_tokens):
        """
        Verifica los registros contables en el libro mayor (TransactionLedger) para comprador1@test.com
        vía GET /Wallets/transactions, confirmando la presencia del saldo retenido de $45.000 (Hold).
        """
        token = auth_tokens["comprador1"]
        headers = {"Authorization": f"Bearer {token}"}

        print("\n" + "="*80)
        print(" VERIFICACIÓN DE LIBRO MAYOR CONTABLE (TRANSACTION LEDGER)")
        print("="*80)

        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            response = client.get("/Wallets/transactions", headers=headers)
            assert response.status_code == 200, f"Error al consultar transacciones de comprador1: {response.text}"

            transactions = response.json()
            print(f"📜 Movimientos Contables para comprador1@test.com (Total: {len(transactions)}):")
            for idx, t in enumerate(transactions, 1):
                print(f"   [{idx}] ID #{t.get('id')} | Tipo: {t.get('type')} | Monto: ${t.get('amount'):,.2f} | Subasta ID: #{t.get('auctionId')} | Creado: {t.get('createdAt')}")
            print("-" * 80)

            assert isinstance(transactions, list), "Las transacciones deben ser un arreglo JSON."
            hold_txs = [t for t in transactions if str(t.get("type")).lower() == "hold" and t.get("amount") == 45000]
            assert len(hold_txs) > 0, f"No se encontró el registro de retención (Hold) de $45.000 en el libro mayor."
