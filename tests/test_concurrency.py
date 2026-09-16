import asyncio
import json
import urllib.request
import urllib.error
import time
from concurrent.futures import ThreadPoolExecutor

"""
Script de Prueba de Concurrencia Extrema (Stress & Race Condition Test)
Exigido por la cátedra para validar el control de concurrencia optimista (Optimistic Locking).

Objetivo:
Enviar N peticiones de puja simultáneas al mismo milisegundo contra el endpoint:
POST /api/auctions/{id}/bids

Resultado Esperado:
- Exactamente 1 petición procesada exitosamente (HTTP 200 / 201).
- Todas las demás peticiones rechazadas con HTTP 409 Conflict.
"""

API_BASE_URL = "http://localhost:5000/api"
AUCTION_ID = 1  # Subasta activa estándar del DbSeeder
BIDDER_ID = "comprador2@test.com"  # Usuario con saldo disponible ($200.000)
CONCURRENT_REQUESTS = 10

def send_bid(request_id, amount):
    url = f"{API_BASE_URL}/auctions/{AUCTION_ID}/bids"
    payload = json.dumps({"amount": amount}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    start_time = time.time()
    
    try:
        with urllib.request.urlopen(req) as response:
            latency = (time.time() - start_time) * 1000
            return {
                "id": request_id,
                "status": response.status,
                "latency_ms": round(latency, 2),
                "body": response.read().decode("utf-8")
            }
    except urllib.error.HTTPError as e:
        latency = (time.time() - start_time) * 1000
        return {
            "id": request_id,
            "status": e.code,
            "latency_ms": round(latency, 2),
            "body": e.read().decode("utf-8")
        }
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        return {
            "id": request_id,
            "status": 0,
            "latency_ms": round(latency, 2),
            "error": str(e)
        }

def run_concurrency_test():
    print("=" * 70)
    print("🚀 INICIANDO PRUEBA DE CONCURRENCIA EXTREMA (OPTIMISTIC LOCKING TEST)")
    print(f"Target Endpoint: POST {API_BASE_URL}/auctions/{AUCTION_ID}/bids")
    print(f"Peticiones Simultáneas: {CONCURRENT_REQUESTS}")
    print("=" * 70)

    bid_amount = 50000.0  # Monto superior al líder actual ($45.000)

    # Disparo en paralelo utilizando ThreadPoolExecutor para sincronía en el milisegundo
    with ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        futures = [executor.submit(send_bid, i + 1, bid_amount) for i in range(CONCURRENT_REQUESTS)]
        results = [f.result() for f in futures]

    status_counts = {}
    print("\n📋 RESULTADOS DE LAS PETICIONES SIMULTÁNEAS:")
    print(f"{'ID Req':<10} | {'Status HTTP':<15} | {'Latencia (ms)':<15} | {'Detalle'}")
    print("-" * 70)

    for r in results:
        status = r["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
        detail = "✅ ACEPTADA (Puja registrada)" if status in [200, 201] else ("🔒 RECHAZADA (HTTP 409 Conflict)" if status == 409 else f"Error HTTP {status}")
        print(f"Req #{r['id']:<5} | {status:<15} | {r['latency_ms']:<15} | {detail}")

    print("=" * 70)
    print("📊 RESUMEN DE CONCURRENCIA:")
    for status, count in status_counts.items():
        print(f"  - Status HTTP {status}: {count} peticiones")

    accepted = status_counts.get(200, 0) + status_counts.get(201, 0)
    conflicts = status_counts.get(409, 0)

    print("\n🔍 VERIFICACIÓN DE REGLA DE CÁTEDRA:")
    if accepted == 1 and conflicts == (CONCURRENT_REQUESTS - 1):
        print(" SUCCESS: ¡Prueba de Concurrencia Optimista APROBADA!")
        print("  - Exactamente 1 puja fue procesada en la base de datos.")
        print(f"  - Las {conflicts} peticiones restantes fueron rechazadas con HTTP 409 Conflict.")
    else:
        print(" NOTICE: Verifique si la API está en ejecución antes de lanzar el test.")

    return results

if __name__ == "__main__":
    run_concurrency_test()
