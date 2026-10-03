import argparse
import csv
import sys

from datetime import datetime, timezone
from io import StringIO
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from packages.shared import (
	EXPECTED_CSV_COLUMNS,
	clean,
	validate_branch,
	validate_category,
	validate_csv_row,
	validate_origin,
	validate_status,
)
from services.api.database import (
	create_incident,
	incident_imported,
	list_incidents,
	record_incident_import,
)


STATUS_MAP = {
	"OPEN": "open",
	"CLOSED": "resolved",
	"DISCARDED": "discarded",
}

CATEGORY_MAP = {
	"LOST_PARCEL": "lost_parcel",
	"DELAYED_DELIVERY": "carrier_issue",
	"WRONG_ADDRESS": "delivery_failure",
	"RETURN_REQUEST": "returns_issue",
	"DAMAGE": "carrier_issue",
}

BRANCH_MAP = {
	"US": "la_office",
	"ES": "zaragoza_office",
}


def seed_incidents(
	csv_text: str,
) -> tuple[dict[str, int], list[dict[str, int | str]]]:
	reader = csv.DictReader(StringIO(csv_text), strict=True)
	if not reader.fieldnames:
		raise ValueError("El CSV no contiene encabezados")

	missing_columns = set(EXPECTED_CSV_COLUMNS) - {"incident_id"} - set(reader.fieldnames)
	if missing_columns:
		raise ValueError(
			"Faltan columnas requeridas: "
			+ ", ".join(sorted(missing_columns))
		)

	counts = {"inserted": 0, "skipped": 0, "rejected": 0}
	invalid_rows = []

	for row_number, row in enumerate(reader, start=2):
		try:
			errors = validate_csv_row(row, require_incident_id=False)
			if errors:
				raise ValueError(", ".join(errors))

			description = row["description"]
			title = clean(description)[:120].strip()
			if not title:
				raise ValueError("empty_title")

			created_at = datetime.strptime(
				clean(row["date"]), "%Y-%m-%d"
			).replace(tzinfo=timezone.utc)
			source_key = clean(row.get("incident_id")) or (
				f"{title}|{created_at.isoformat()}"
			)

			if incident_imported(source_key):
				counts["skipped"] += 1
				continue

			payload = {
				"title": title,
				"description": description,
				"category": validate_category(CATEGORY_MAP[clean(row["category"])]),
				"status": validate_status(STATUS_MAP[clean(row["status"])]),
				"origin": validate_origin("customer"),
				"branch": validate_branch(BRANCH_MAP[clean(row["country"])]),
			}
			incident = create_incident(payload, created_at=created_at)
			record_incident_import(source_key, incident["id"])
			counts["inserted"] += 1
		except (KeyError, ValueError) as error:
			counts["rejected"] += 1
			invalid_rows.append({"line": row_number, "error": str(error)})

	return counts, invalid_rows


def main() -> int:
	parser = argparse.ArgumentParser(
		description="Importa incidencias válidas desde el CSV de TrackFlow."
	)
	parser.add_argument(
		"csv_file",
		nargs="?",
		type=Path,
		default=ROOT / "scripts" / "incidents-trackflow.csv",
	)
	args = parser.parse_args()

	try:
		csv_text = args.csv_file.read_text(encoding="utf-8-sig")
		counts, invalid_rows = seed_incidents(csv_text)
	except (OSError, UnicodeDecodeError, csv.Error, ValueError) as error:
		print(f"No se pudo importar el CSV: {error}", file=sys.stderr)
		return 1

	print("Seed terminado")
	print(
		f"{counts['inserted']} insertadas, "
		f"{counts['skipped']} duplicadas, "
		f"{counts['rejected']} descartadas."
	)
	for invalid_row in invalid_rows:
		print(f"Fila {invalid_row['line']}: {invalid_row['error']}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
