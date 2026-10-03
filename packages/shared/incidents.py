import re

from datetime import datetime


EXPECTED_CSV_COLUMNS = [
    "incident_id",
    "date",
    "country",
    "customer_type",
    "tracking_number",
    "carrier",
    "category",
    "description",
    "status",
    "customer_email",
    "satisfaction_score",
]

VALID_CSV_COUNTRIES = ["US", "ES"]
VALID_CSV_CUSTOMER_TYPES = ["B2B", "B2C"]
VALID_CSV_CARRIERS_BY_COUNTRY = {
    "US": {"UPS", "FEDEX", "DHL_US"},
    "ES": {"MRW", "SEUR", "DHL_ES", "LOCAL_ES"},
}
VALID_CSV_CATEGORIES = [
    "LOST_PARCEL",
    "DELAYED_DELIVERY",
    "WRONG_ADDRESS",
    "RETURN_REQUEST",
    "DAMAGE",
]
VALID_CSV_STATUSES = ["OPEN", "CLOSED", "DISCARDED"]

VALID_INCIDENT_CATEGORIES = {
    "lost_parcel",
    "delivery_failure",
    "inventory_discrepancy",
    "carrier_issue",
    "returns_issue",
    "warehouse_incident",
    "system_failure",
    "client_complaint",
    "other",
}
VALID_INCIDENT_STATUSES = {
    "open",
    "in_progress",
    "resolved",
    "discarded",
}
ALLOWED_TRANSITIONS = {
    "open": {"in_progress", "discarded"},
    "in_progress": {"resolved", "discarded"},
    "resolved": set(),
    "discarded": set(),
}
VALID_INCIDENT_ORIGINS = {"customer", "branch", "internal"}
VALID_BRANCHES = {
    "central",
    "la_warehouse",
    "la_office",
    "zaragoza_warehouse",
    "zaragoza_office",
}


def validate_category(value: str) -> str:
    if value not in VALID_INCIDENT_CATEGORIES:
        raise ValueError("Categoría no válida")
    return value


def validate_origin(value: str) -> str:
    if value not in VALID_INCIDENT_ORIGINS:
        raise ValueError("Origen no válido")
    return value


def validate_branch(value: str) -> str:
    if value not in VALID_BRANCHES:
        raise ValueError("Sede no válida")
    return value


def validate_status(value: str) -> str:
    if value not in VALID_INCIDENT_STATUSES:
        raise ValueError("Estado no válido")
    return value


class InvalidStatusTransition(ValueError):
    pass


def validate_status_transition(current_status: str, new_status: str) -> str:
    validate_status(current_status)
    validate_status(new_status)
    if new_status not in ALLOWED_TRANSITIONS[current_status]:
        if current_status == "resolved" and new_status == "open":
            message = "Una incidencia resuelta no puede volver a estado abierto"
        elif current_status == "resolved":
            message = "Una incidencia resuelta no puede cambiar de estado"
        elif current_status == "discarded":
            message = "Una incidencia descartada no puede cambiar de estado"
        else:
            message = (
                f"No se permite cambiar una incidencia de "
                f"{current_status} a {new_status}"
            )
        raise InvalidStatusTransition(message)
    return new_status


def validate_title(value: str) -> str:
    title = value.strip()
    if not title:
        raise ValueError("El título es obligatorio")
    if len(title) > 120:
        raise ValueError("El título no puede superar 120 caracteres")
    return title


def validate_description(value: str) -> str:
    if not value.strip():
        raise ValueError("La descripción es obligatoria")
    return value


def clean(value):
    if value is None:
        return ""
    return str(value).strip()


def valid_date(value):
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def validate_csv_row(row, require_incident_id=True):
    errors = []

    incident_id = clean(row.get("incident_id"))
    if not incident_id and require_incident_id:
        errors.append("missing_incident_id")
    elif incident_id and not re.fullmatch(r"TRF-\d{6}", incident_id):
        errors.append("invalid_incident_id")

    date = clean(row.get("date"))
    if not date:
        errors.append("missing_date")
    elif not valid_date(date):
        errors.append("invalid_date")

    country = clean(row.get("country"))
    if country not in VALID_CSV_COUNTRIES:
        errors.append("invalid_country")

    customer_type = clean(row.get("customer_type"))
    if customer_type not in VALID_CSV_CUSTOMER_TYPES:
        errors.append("invalid_customer_type")

    tracking_number = clean(row.get("tracking_number"))
    if len(tracking_number) < 8:
        errors.append("invalid_tracking_number")

    carrier = clean(row.get("carrier"))
    valid_carriers = VALID_CSV_CARRIERS_BY_COUNTRY.get(country, set())
    if carrier not in valid_carriers:
        errors.append("invalid_carrier")

    category = clean(row.get("category"))
    if category not in VALID_CSV_CATEGORIES:
        errors.append("invalid_category")

    description = clean(row.get("description"))
    if len(description) < 5:
        errors.append("invalid_description")

    status = clean(row.get("status"))
    if status not in VALID_CSV_STATUSES:
        errors.append("invalid_status")

    customer_email = clean(row.get("customer_email"))
    if not customer_email or "@" not in customer_email:
        errors.append("invalid_customer_email")

    score_text = clean(row.get("satisfaction_score"))
    if status == "CLOSED" and not score_text:
        errors.append("closed_missing_score")

    if score_text:
        try:
            score = int(score_text)
        except ValueError:
            errors.append("invalid_score")
        else:
            if not 1 <= score <= 5:
                errors.append("invalid_score")

    return errors