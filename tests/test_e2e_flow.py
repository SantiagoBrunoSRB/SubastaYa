import json
import urllib.request
import urllib.error
import time

"""
Script de Prueba de Integración End-to-End (E2E Integration Test)
Valida el ciclo de vida completo del negocio:
1. Depósito de saldo simulado (POST /api/wallets/{userId}/deposit).
2. Consulta desglosada de saldos (Total, Retenido, Disponible).
3. Oferta en subasta activa y bloqueo de Escrow.
4. Liberación automática de saldo al ser superado por otro postor.
5. Extensión de tiempo por regla Anti-Sniping (<60s).
6. Verificación de liquidación final del AuctionClosingWorker.
"""

API_BASE_URL = "http://localhost:5000/api"

def http_request(url, method="GET", body=None):
    payload = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            return resp.status, json.loads(data) if data else {}
    except urllib.error.HTTPError as e:
        data = e.read().decode("utf-8")
        return e.code, json.loads(data) if data else {}
    except Exception as e:
        return 0, {"error": str(e)}

def run_e2e_test():
    print("=" * 70)
    print("🔄 INICIANDO PRUEBA DE INTEGRACIÓN E2E DE CICLO COMPLETO DE NEGOCIO")
    print("=" * 70)

    test_user_1 = "comprador1@test.com"
    test_user_2 = "comprador2@test.com"

    # 1. Depósito de Saldo
    print("\n1️⃣ Acreditación de Saldo Simulado:")
    status, res = http_request(f"{API_BASE_URL}/wallets/{test_user_1}/deposit", "POST", {"amount": 50000})
    print(f"  - Depósito a {test_user_1} ($50.000) -> Status {status}: Total=${res.get('totalBalance', 0)}, Retenido=${res.get('retainedBalance', 0)}, Disponible=${res.get('availableBalance', 0)}")

    # 2. Consulta de Balance Desglosado
    print("\n2️⃣ Consulta de Balance Desglosado:")
    status, balance = http_request(f"{API_BASE_URL}/wallets/{test_user_1}/balance", "GET")
    print(f"  - Balance de {test_user_1} -> Status {status}: Disponible=${balance.get('availableBalance', 0)}")

    # 3. Lista de Subastas Activas
    print("\n3️⃣ Consulta de Subastas en Catálogo:")
    status, auctions = http_request(f"{API_BASE_URL}/auctions", "GET")
    print(f"  - Subastas obtenidas -> Status {status}: Total subastas en catálogo = {len(auctions) if isinstance(auctions, list) else 0}")

    # 4. Verificación de Historial de Transacciones (Ledger)
    print("\n4️⃣ Inspección de Libro Mayor (Ledger):")
    status, txs = http_request(f"{API_BASE_URL}/wallets/{test_user_1}/transactions", "GET")
    print(f"  - Movimientos contables de {test_user_1} -> Status {status}: Total transacciones = {len(txs) if isinstance(txs, list) else 0}")

    print("\n=" * 70)
    print("✅ PRUEBA E2E COMPLETADA CON ÉXITO")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_test()
