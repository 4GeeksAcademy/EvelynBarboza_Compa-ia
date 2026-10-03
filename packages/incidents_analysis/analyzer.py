import csv
from collections import Counter
from io import StringIO

from packages.shared.incidents import (
    EXPECTED_CSV_COLUMNS as EXPECTED_COLUMNS,
    VALID_CSV_CATEGORIES as VALID_CATEGORIES,
    VALID_CSV_CARRIERS_BY_COUNTRY as VALID_CARRIERS_BY_COUNTRY,
    VALID_CSV_COUNTRIES as VALID_COUNTRIES,
    VALID_CSV_CUSTOMER_TYPES as VALID_CUSTOMER_TYPES,
    VALID_CSV_STATUSES as VALID_STATUSES,
    clean,
    validate_csv_row as validate_row,
)


ERROR_LABELS = {
    "missing_incident_id":
        "Missing incident_id",

    "invalid_incident_id":
        "Invalid incident_id format",

    "missing_date":
        "Missing date",

    "invalid_date":
        "Invalid date format",

    "invalid_country":
        "Invalid or missing country",

    "invalid_customer_type":
        "Invalid or missing customer_type",

    "invalid_tracking_number":
        "Invalid tracking number",

    "invalid_carrier":
        "Carrier/country mismatch",

    "invalid_category":
        "Invalid or missing category",

    "invalid_description":
        "Empty or too-short description",

    "invalid_status":
        "Invalid or missing status",

    "invalid_customer_email":
        "Invalid or missing email",

    "closed_missing_score":
        "Closed case, no score",

    "invalid_score":
        "Invalid satisfaction_score",
}


def build_breakdown(
    counter,
    possible_values,
    total,
):

    breakdown = {}


    for value in possible_values:

        count = counter.get(
            value,
            0,
        )


        if total:

            percentage = round(
                (
                    count
                    / total
                )
                * 100,
                1,
            )

        else:

            percentage = 0.0


        breakdown[value] = {
            "count": count,
            "percentage": percentage,
        }


    return breakdown


def analyze_csv_text(
    text,
    source_file=(
        "incidents-trackflow.csv"
    ),
):

    if (
        not text
        or not text.strip()
    ):

        raise ValueError(
            "El fichero CSV está vacío"
        )


    try:

        reader = csv.DictReader(
            StringIO(text),
            strict=True,
        )


        if not reader.fieldnames:

            raise ValueError(
                "El CSV no contiene "
                "encabezados"
            )


        missing_columns = [
            column
            for column
            in EXPECTED_COLUMNS

            if column
            not in reader.fieldnames
        ]


        if missing_columns:

            raise ValueError(
                "Faltan columnas "
                "obligatorias: "
                + ", ".join(
                    missing_columns
                )
            )


        rows = list(
            reader
        )


    except csv.Error as error:

        raise ValueError(
            "El fichero no contiene "
            "un CSV válido"
        ) from error


    if not rows:

        raise ValueError(
            "El CSV no contiene registros"
        )


    valid_rows = []

    invalid_reason_counts = (
        Counter()
    )

    invalid_records = 0


    for row in rows:

        problems = validate_row(
            row
        )


        if problems:

            invalid_records += 1

            invalid_reason_counts.update(
                problems
            )


        else:

            valid_rows.append(
                row
            )


    valid_records = len(
        valid_rows
    )


    # Categorías

    category_counts = Counter(

        clean(
            row.get("category")
        )

        for row in valid_rows
    )


    # Estados

    status_counts = Counter(

        clean(
            row.get("status")
        )

        for row in valid_rows
    )


    # Paises

    country_counts = Counter(

        clean(
            row.get("country")
        )

        for row in valid_rows
    )


    # Casos CLOSED válidos

    closed_rows = [

        row

        for row in valid_rows

        if clean(
            row.get("status")
        ) == "CLOSED"

    ]


    # Los CLOSED válidos
    # siempre tienen score válido.

    scores = [

        int(
            clean(
                row.get(
                    "satisfaction_score"
                )
            )
        )

        for row in closed_rows

    ]


    score_counts = Counter(
        scores
    )


    if scores:

        average_score = round(
            sum(scores)
            / len(scores),
            2,
        )

    else:

        average_score = None


    invalid_breakdown = {

        ERROR_LABELS.get(
            code,
            code,
        ): count

        for code, count
        in invalid_reason_counts.items()

    }


    return {

        "company":
            "TRACKFLOW",

        "source_file":
            source_file,

        "total_records":
            len(rows),

        "valid_records":
            valid_records,

        "invalid_records":
            invalid_records,

        "invalid_breakdown":
            invalid_breakdown,

        "by_category":
            build_breakdown(
                category_counts,
                VALID_CATEGORIES,
                valid_records,
            ),

        "by_status":
            build_breakdown(
                status_counts,
                VALID_STATUSES,
                valid_records,
            ),

        "by_country":
            build_breakdown(
                country_counts,
                VALID_COUNTRIES,
                valid_records,
            ),

        "satisfaction": {

            "closed_cases":
                len(closed_rows),

            "scored_cases":
                len(scores),

            "average":
                average_score,

            "scores": {

                str(score):
                    score_counts.get(
                        score,
                        0,
                    )

                for score
                in range(1, 6)

            },
        },
    }


def format_summary(
    summary
):

    lines = [

        "=" * 60,

        (
            "  TRACKFLOW — "
            "INCIDENT REPORT ANALYSIS"
        ),

        (
            "  Source file: "
            f"{summary['source_file']}"
        ),

        "=" * 60,

        "",

        (
            "TOTAL RECORDS IN FILE "
            ".......... "
            f"{summary['total_records']}"
        ),

        (
            "  Valid records "
            "................ "
            f"{summary['valid_records']}"
        ),

        (
            "  Invalid / incomplete "
            "......... "
            f"{summary['invalid_records']}"
        ),

        "",

        "INVALID RECORDS BREAKDOWN",

    ]


    if summary[
        "invalid_breakdown"
    ]:

        for reason, count in (
            summary[
                "invalid_breakdown"
            ].items()
        ):

            lines.append(
                f"  {reason:<42} "
                f"{count}"
            )

    else:

        lines.append(
            "  No invalid records"
        )


    lines.extend([
        "",
        (
            "BREAKDOWN BY CATEGORY "
            "(valid records)"
        ),
    ])


    for category, data in (
        summary[
            "by_category"
        ].items()
    ):

        lines.append(

            f"  {category:<28} "

            f"{data['count']:>3}  "

            f"("
            f"{data['percentage']:.1f}"
            f"%)"

        )


    lines.extend([
        "",
        (
            "BREAKDOWN BY STATUS "
            "(valid records)"
        ),
    ])


    for status, data in (
        summary[
            "by_status"
        ].items()
    ):

        lines.append(

            f"  {status:<28} "

            f"{data['count']:>3}  "

            f"("
            f"{data['percentage']:.1f}"
            f"%)"

        )


    lines.extend([
        "",
        (
            "BREAKDOWN BY COUNTRY "
            "(valid records)"
        ),
    ])


    for country, data in (
        summary[
            "by_country"
        ].items()
    ):

        lines.append(

            f"  {country:<28} "

            f"{data['count']:>3}  "

            f"("
            f"{data['percentage']:.1f}"
            f"%)"

        )


    satisfaction = (
        summary[
            "satisfaction"
        ]
    )


    lines.extend([

        "",

        (
            "SATISFACTION INDEX "
            "(closed cases)"
        ),

        (
            "  Scored cases: "
            f"{satisfaction['scored_cases']} "
            "of "
            f"{satisfaction['closed_cases']}"
        ),

    ])


    if (
        satisfaction[
            "average"
        ] is None
    ):

        lines.append(
            "  Average score: N/A"
        )

    else:

        lines.append(

            "  Average score: "

            f"{satisfaction['average']:.2f}"

            " / 5.00"

        )


    score_labels = {

        "1":
            "Very dissatisfied",

        "2":
            "Dissatisfied",

        "3":
            "Neutral",

        "4":
            "Satisfied",

        "5":
            "Very satisfied",

    }


    for score, count in (
        satisfaction[
            "scores"
        ].items()
    ):

        label = (
            score_labels[
                score
            ]
        )

        lines.append(

            f"  Score {score} "

            f"({label}) "

            f"........ {count}"

        )


    lines.extend([
        "",
        "=" * 60,
    ])


    return "\n".join(
        lines
    )


def summary_to_csv(
    summary
):

    output = StringIO()

    writer = csv.writer(
        output
    )


    writer.writerow([
        "metric",
        "value",
        "percentage",
    ])


    writer.writerow([
        "total_records",
        summary[
            "total_records"
        ],
        "",
    ])


    writer.writerow([
        "valid_records",
        summary[
            "valid_records"
        ],
        "",
    ])


    writer.writerow([
        "invalid_records",
        summary[
            "invalid_records"
        ],
        "",
    ])


    for reason, count in (
        summary[
            "invalid_breakdown"
        ].items()
    ):

        writer.writerow([
            f"invalid.{reason}",
            count,
            "",
        ])


    for category, data in (
        summary[
            "by_category"
        ].items()
    ):

        writer.writerow([

            f"category.{category}",

            data[
                "count"
            ],

            data[
                "percentage"
            ],

        ])


    for status, data in (
        summary[
            "by_status"
        ].items()
    ):

        writer.writerow([

            f"status.{status}",

            data[
                "count"
            ],

            data[
                "percentage"
            ],

        ])


    for country, data in (
        summary[
            "by_country"
        ].items()
    ):

        writer.writerow([

            f"country.{country}",

            data[
                "count"
            ],

            data[
                "percentage"
            ],

        ])


    satisfaction = (
        summary[
            "satisfaction"
        ]
    )


    writer.writerow([

        "satisfaction.closed_cases",

        satisfaction[
            "closed_cases"
        ],

        "",

    ])


    writer.writerow([

        "satisfaction.scored_cases",

        satisfaction[
            "scored_cases"
        ],

        "",

    ])


    writer.writerow([

        "satisfaction.average",

        satisfaction[
            "average"
        ],

        "",

    ])


    for score, count in (
        satisfaction[
            "scores"
        ].items()
    ):

        writer.writerow([

            (
                "satisfaction."
                f"score_{score}"
            ),

            count,

            "",

        ])


    return output.getvalue()
