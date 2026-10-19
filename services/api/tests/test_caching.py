from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from packages.shared.cache import TTLCache
from services.api import database, main
from services.api.routes import incidents


def test_ttl_expiry_capacity_and_mutation_isolation():
    now = [0]
    cache = TTLCache(10, max_entries=2, clock=lambda: now[0])
    loader = Mock(return_value={"values": [1]})
    cache.get_or_set("first", loader)["values"].append(2)
    assert cache.get_or_set("first", loader) == {"values": [1]}
    assert loader.call_count == 1
    now[0] = 10
    cache.get_or_set("first", loader)
    assert loader.call_count == 2
    cache.get_or_set("second", loader)
    cache.get_or_set("third", loader)
    cache.get_or_set("first", loader)
    assert loader.call_count == 5
    cache.clear()
    cache.get_or_set("first", loader)
    assert loader.call_count == 6


def test_concurrent_misses_only_load_once():
    cache = TTLCache(10)
    loader = Mock(return_value={"total": 42})
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(lambda _: cache.get_or_set("key", loader), range(32)))
    assert results == [{"total": 42}] * 32
    loader.assert_called_once()


def test_loader_failure_is_not_cached():
    cache = TTLCache(10)
    loader = Mock(side_effect=[ValueError("failed"), 42])
    with pytest.raises(ValueError):
        cache.get_or_set("key", loader)
    assert cache.get_or_set("key", loader) == 42
    assert loader.call_count == 2


def test_summary_hits_and_invalidates_after_create_and_status_update(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "incidents.json")
    database.incident_summary_cache.clear()
    loader = Mock(wraps=incidents.list_incidents)
    monkeypatch.setattr(incidents, "list_incidents", loader)
    with TestClient(main.app) as client:
        first = client.get("/api/incidents/summary")
        assert first.json()["total"] == 0
        assert "app;dur=" in first.headers["Server-Timing"]
        assert client.get("/api/incidents/summary").json() == first.json()
        assert loader.call_count == 1
        created = client.post("/api/incidents", json={
            "title": "Envio demorado", "description": "El paquete no llego a la sede de destino.",
            "category": "delivery_failure", "origin": "customer", "branch": "central",
        })
        assert created.status_code == 201
        summary = client.get("/api/incidents/summary").json()
        assert summary["total"] == 1
        assert summary["by_status"]["open"] == 1
        assert loader.call_count == 2
        updated = client.patch(
            f"/api/incidents/{created.json()['id']}/status", json={"status": "in_progress"}
        )
        assert updated.status_code == 200
        assert client.get("/api/incidents/summary").json()["by_status"]["in_progress"] == 1
        assert loader.call_count == 3