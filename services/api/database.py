from pathlib import Path

from tinydb import Query, TinyDB


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "suppliers.json"
TABLE_NAME = "suppliers"


def get_db() -> TinyDB:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return TinyDB(DB_PATH)


def get_suppliers_table():
    db = get_db()
    return db.table(TABLE_NAME)


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
