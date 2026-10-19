import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from services.api import database, main


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DATA_DIR", tmp_path)
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "suppliers.json")
    monkeypatch.setattr(main, "LAST_ANALYSIS", None)
    return TestClient(main.app)


def test_root_and_incident_analysis_return_explicit_contracts(api_client):
    assert api_client.get("/").json() == {
        "message": "Trackflow Incidents API is running",
    }

    csv_content = (
        "incident_id,date,country,customer_type,tracking_number,carrier,category,"
        "description,status,customer_email,satisfaction_score\n"
        "TRF-000001,2026-01-01,US,B2C,12345678,UPS,LOST_PARCEL,Lost parcel,CLOSED,"
        "customer@example.com,5\n"
    )
    response = api_client.post(
        "/api/incidents/analyze",
        files={"file": ("incidents.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 200
    assert response.json()["company"] == "TRACKFLOW"
    assert response.json()["total_records"] == 1
    assert response.json()["satisfaction"]["average"] == 5.0
    assert "customer@example.com" not in response.text


def test_manual_incident_errors_match_declared_schemas(api_client):
    response = api_client.get("/api/incidents", params={"status": "unknown"})

    assert response.status_code == 400
    assert response.json()["error"] == "validation_error"
    assert set(response.json()) == {"error", "field", "message"}

    response = api_client.get("/api/incidents/999")

    assert response.status_code == 404
    assert response.json() == {
        "error": "not_found",
        "message": "Incidencia no encontrada",
    }


def test_supplier_delete_has_a_typed_json_response(api_client):
    response = api_client.post(
        "/suppliers",
        json={
            "name": "Proveedor de prueba",
            "country": "Spain",
            "categories": ["carrier_last_mile"],
            "rate_per_shipment": 1.5,
            "currency": "EUR",
            "status": "active",
        },
    )
    assert response.status_code == 201

    deleted = api_client.delete(f"/suppliers/{response.json()['id']}")

    assert deleted.status_code == 200
    assert deleted.json() == {"message": "Supplier deleted successfully."}


def test_csv_export_remains_a_file_response(api_client):
    csv_content = (
        "incident_id,date,country,customer_type,tracking_number,carrier,category,"
        "description,status,customer_email,satisfaction_score\n"
        "TRF-000001,2026-01-01,US,B2C,12345678,UPS,LOST_PARCEL,Lost parcel,CLOSED,"
        "customer@example.com,5\n"
    )
    api_client.post(
        "/api/incidents/analyze",
        files={"file": ("incidents.csv", csv_content, "text/csv")},
    )

    response = api_client.get("/api/incidents/results/export")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["content-disposition"].startswith("attachment;")