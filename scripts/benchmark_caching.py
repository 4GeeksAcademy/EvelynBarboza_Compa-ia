import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
from statistics import median
import sys
from tempfile import TemporaryDirectory
from time import perf_counter

from fastapi import FastAPI, Response
from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def measure(client, path, operation, repeats):
    def sample(callback):
        durations = []
        for _ in range(repeats):
            started = perf_counter()
            callback()
            durations.append((perf_counter() - started) * 1000)
        return round(median(durations), 3)

    def request():
        response = client.get(path)
        response.raise_for_status()

    return {
        "operation_median_ms": sample(operation),
        "http_median_ms": sample(request),
    }


def incidents_benchmark(directory, sizes, repeats, uncached):
    from tinydb import TinyDB
    from packages.shared import (
        VALID_BRANCHES, VALID_INCIDENT_CATEGORIES,
        VALID_INCIDENT_ORIGINS, VALID_INCIDENT_STATUSES,
    )
    from services.api import database, main
    from services.api.routes.incidents import incidents_summary_endpoint

    if uncached:
        database.incident_summary_cache.get_or_set = lambda key, loader: loader()

    database.DATA_DIR = Path(directory)
    database.DB_PATH = Path(directory) / "incidents.json"
    dimensions = [sorted(values) for values in (
        VALID_BRANCHES, VALID_INCIDENT_CATEGORIES,
        VALID_INCIDENT_ORIGINS, VALID_INCIDENT_STATUSES,
    )]
    results = {}
    for size in sizes:
        with TinyDB(database.DB_PATH) as db:
            table = db.table("incidents")
            table.truncate()
            now = datetime(2026, 1, 1, tzinfo=timezone.utc)
            table.insert_multiple({
                "title": f"Incidencia de transporte {index}",
                "description": f"Revision del envio TRF-{index:07d} en su sede de destino.",
                **{
                    field: values[index % len(values)]
                    for field, values in zip(
                        ("branch", "category", "origin", "status"), dimensions
                    )
                },
                "created_at": (now + timedelta(minutes=index)).isoformat(),
                "updated_at": (now + timedelta(minutes=index + 30)).isoformat(),
            } for index in range(size))
        cache = getattr(database, "incident_summary_cache", None)
        if cache is not None:
            cache.clear()
        with TestClient(main.app) as client:
            results[str(size)] = measure(
                client, "/api/incidents/summary", incidents_summary_endpoint, repeats
            )
    return results


def inventory_benchmark(directory, sizes, repeats, uncached):
    os.environ["DATABASE_URL"] = f"sqlite:///{directory}/inventory.sqlite"
    os.environ.setdefault("JWT_SECRET", "benchmark-only-not-for-production")
    sys.path.insert(0, str(ROOT / "services-aut" / "api"))
    from sqlmodel import Session, SQLModel
    import database
    from auth import get_current_user
    from models import SKU, StockEntry, StockExit
    from routers.inventory import get_orders, router
    from routers import inventory

    if uncached:
        inventory.orders_cache.get_or_set = lambda key, loader: loader()

    app = FastAPI()
    app.include_router(router)
    user = {"id": "benchmark-user"}
    app.dependency_overrides[get_current_user] = lambda: user
    results = {}
    for size in sizes:
        SQLModel.metadata.drop_all(database.engine)
        SQLModel.metadata.create_all(database.engine)
        with Session(database.engine) as session:
            products = [SKU(
                name=f"Producto {index}", sku=f"SKU-{index:05d}",
                client_name=f"Cliente {index % 12}", category=f"Categoria {index % 8}",
                warehouse=f"Sede {index % 4}",
            ) for index in range(max(1, size // 20))]
            session.add_all(products)
            session.commit()
            now = datetime(2026, 1, 1, tzinfo=timezone.utc)
            movements = []
            available = {product.id: 0 for product in products}
            for index in range(size):
                product = products[index % len(products)]
                common = {
                    "sku_id": product.id, "quantity": 1 + index % 25,
                    "warehouse": product.warehouse,
                    "created_at": now + timedelta(minutes=index),
                    "user_uuid": f"operador-{index % 20}",
                }
                if index % 3 == 0 and available[product.id] > 0:
                    common["quantity"] = min(common["quantity"], available[product.id])
                    available[product.id] -= common["quantity"]
                    movements.append(StockExit(**common, exit_type="loss"))
                else:
                    available[product.id] += common["quantity"]
                    movements.append(StockEntry(**common, reference=f"Compra-{index}"))
            session.add_all(movements)
            session.commit()
            cache = getattr(inventory, "orders_cache", None)
            if cache is not None:
                cache.clear()
            def operation():
                import inspect
                kwargs = {"db": session}
                if "current_user" in inspect.signature(get_orders).parameters:
                    kwargs["current_user"] = user
                if "response" in inspect.signature(get_orders).parameters:
                    kwargs["response"] = Response()
                return get_orders(**kwargs)
            with TestClient(app) as client:
                results[str(size)] = measure(
                    client, "/inventory/orders", operation, repeats
                )
    database.engine.dispose()
    return results


def main():
    parser = argparse.ArgumentParser(description="Benchmark con bases temporales, nunca produccion")
    parser.add_argument("service", choices=("incidents", "inventory"))
    parser.add_argument("--sizes", nargs="+", type=int, default=[20, 10000])
    parser.add_argument("--repeats", type=int, default=15)
    parser.add_argument("--uncached", action="store_true", help="Ejecutar el calculo original sin cache")
    args = parser.parse_args()
    if min(args.sizes) < 1 or args.repeats < 3:
        parser.error("Usa tamanos positivos y al menos tres repeticiones")
    with TemporaryDirectory(prefix="trackflow-benchmark-") as directory:
        benchmark = incidents_benchmark if args.service == "incidents" else inventory_benchmark
        print(json.dumps(benchmark(directory, args.sizes, args.repeats, args.uncached), indent=2))


if __name__ == "__main__":
    main()