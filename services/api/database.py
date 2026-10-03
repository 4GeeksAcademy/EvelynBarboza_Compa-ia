from pathlib import Path
from datetime import datetime, timezone

from tinydb import Query, TinyDB

from packages.shared import validate_status_transition
from services.api.models import Incident, IncidentCreate


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "suppliers.json"
TABLE_NAME = "suppliers"
INCIDENTS_TABLE_NAME = "incidents"
INCIDENT_IMPORTS_TABLE_NAME = "incident_imports"


def get_db() -> TinyDB:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return TinyDB(DB_PATH)


def get_suppliers_table():
    db = get_db()
    return db.table(TABLE_NAME)


def get_incidents_table():
	db = get_db()
	return db.table(INCIDENTS_TABLE_NAME)


def _serialize_document(document):
    data = dict(document)
    data["id"] = document.doc_id
    return data


def list_suppliers(
    country=None,
    category=None,
):
    db = get_db()

    try:
        table = db.table(TABLE_NAME)
        query = Query()

        if country and category:
            documents = table.search(
                (query.country == country)
                & query.categories.test(
                    lambda values: category in values
                )
            )

        elif country:
            documents = table.search(
                query.country == country
            )

        elif category:
            documents = table.search(
                query.categories.test(
                    lambda values: category in values
                )
            )

        else:
            documents = table.all()

        return [
            _serialize_document(document)
            for document in documents
        ]

    finally:
        db.close()


def get_supplier_by_id(supplier_id: int):
    db = get_db()

    try:
        table = db.table(TABLE_NAME)
        document = table.get(doc_id=supplier_id)

        if document is None:
            return None

        return _serialize_document(document)

    finally:
        db.close()


def create_supplier(payload: dict):
    db = get_db()

    try:
        table = db.table(TABLE_NAME)
        doc_id = table.insert(payload)
        document = table.get(doc_id=doc_id)
        return _serialize_document(document)

    finally:
        db.close()


def update_supplier(
    supplier_id: int,
    payload: dict,
):
    db = get_db()

    try:
        table = db.table(TABLE_NAME)

        if table.get(doc_id=supplier_id) is None:
            return None

        table.update(
            payload,
            doc_ids=[supplier_id],
        )

        document = table.get(doc_id=supplier_id)
        return _serialize_document(document)

    finally:
        db.close()


def delete_supplier(supplier_id: int):
    db = get_db()

    try:
        table = db.table(TABLE_NAME)

        if table.get(doc_id=supplier_id) is None:
            return False

        table.remove(doc_ids=[supplier_id])
        return True

    finally:
        db.close()


def supplier_exists(
    name: str,
    country: str,
):
    db = get_db()

    try:
        table = db.table(TABLE_NAME)
        query = Query()

        return table.contains(
            (query.name == name)
            & (query.country == country)
        )

    finally:
        db.close()


def list_incidents(
    status: str | None = None,
    origin: str | None = None,
    branch: str | None = None,
    category: str | None = None,
):
    db = get_db()
    try:
        table = db.table(INCIDENTS_TABLE_NAME)
        filters = {
            key: value
            for key, value in {
                "status": status,
                "origin": origin,
                "branch": branch,
                "category": category,
            }.items()
            if value is not None
        }
        return [
            Incident.model_validate(_serialize_document(document)).model_dump(mode="json")
            for document in table.all()
            if all(document.get(key) == value for key, value in filters.items())
        ]
    finally:
        db.close()


def get_incident_by_id(incident_id: int):
    db = get_db()
    try:
        document = db.table(INCIDENTS_TABLE_NAME).get(doc_id=incident_id)
        if document is None:
            return None
        return Incident.model_validate(
            _serialize_document(document)
        ).model_dump(mode="json")
    finally:
        db.close()


def update_incident_status(incident_id: int, new_status: str):
    db = get_db()
    try:
        table = db.table(INCIDENTS_TABLE_NAME)
        document = table.get(doc_id=incident_id)
        if document is None:
            return None

        validated_status = validate_status_transition(
            document["status"], new_status
        )
        updated_at = datetime.now(timezone.utc).isoformat()
        table.update(
            {"status": validated_status, "updated_at": updated_at},
            doc_ids=[incident_id],
        )
        return Incident.model_validate(
            _serialize_document(table.get(doc_id=incident_id))
        ).model_dump(mode="json")
    finally:
        db.close()


def create_incident(payload: dict, created_at: datetime | None = None):
    validated_payload = IncidentCreate.model_validate(payload)
    now = datetime.now(timezone.utc)
    incident_data = {
        **validated_payload.model_dump(),
        "created_at": (created_at or now).isoformat(),
        "updated_at": now.isoformat(),
    }

    db = get_db()
    try:
        table = db.table(INCIDENTS_TABLE_NAME)
        doc_id = table.insert(incident_data)
        incident = Incident.model_validate(
            _serialize_document(table.get(doc_id=doc_id))
        )
        return incident.model_dump(mode="json")
    finally:
        db.close()


def incident_imported(source_key: str) -> bool:
    db = get_db()
    try:
        return db.table(INCIDENT_IMPORTS_TABLE_NAME).contains(
            Query().source_key == source_key
        )
    finally:
        db.close()


def record_incident_import(source_key: str, incident_id: int):
    db = get_db()
    try:
        table = db.table(INCIDENT_IMPORTS_TABLE_NAME)
        if not table.contains(Query().source_key == source_key):
            table.insert({"source_key": source_key, "incident_id": incident_id})
    finally:
        db.close()
