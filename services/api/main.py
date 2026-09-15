import logging

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)

from fastapi import Request
from fastapi.responses import (
    JSONResponse,
    Response,
)


from packages.incidents_analysis import (
    analyze_csv_text,
    summary_to_csv,
)
from services.api.routes.suppliers import (
    router as suppliers_router,
)


app = FastAPI(
    title=(
        "Trackflow Incidents API"
    ),
    version="1.0.0",
)

app.include_router(
    suppliers_router
)

logger = logging.getLogger(__name__)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.exception("Error inesperado procesando la solicitud")
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrio un error interno. Intenta nuevamente."},
    )


LAST_ANALYSIS = None


@app.get("/")
def root():

    return {
        "message":
            (
                "Trackflow Incidents "
                "API is running"
            )
    }


@app.post(
    "/api/incidents/analyze"
)
async def analyze_incidents(
    file: UploadFile = File(...)
):

    global LAST_ANALYSIS


    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero "
                "no tiene nombre."
            ),
        )


    if not (
        file.filename
        .lower()
        .endswith(".csv")
    ):

        raise HTTPException(
            status_code=415,
            detail=(
                "El fichero debe "
                "tener extensión .csv."
            ),
        )


    try:
        content = await file.read()
    except (OSError, RuntimeError) as error:
        raise HTTPException(
            status_code=400,
            detail="No se pudo leer el fichero enviado.",
        ) from error


    if not content:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero está vacío."
            ),
        )


    try:

        text = content.decode(
            "utf-8-sig"
        )


    except UnicodeDecodeError as error:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero debe "
                "utilizar codificación "
                "UTF-8."
            ),
        ) from error


    try:

        result = analyze_csv_text(
            text=text,
            source_file=file.filename,
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    LAST_ANALYSIS = result


    return result


@app.get(
    "/api/incidents/results/export"
)
def export_results():

    if LAST_ANALYSIS is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Todavía no existe "
                "ningún análisis "
                "para exportar."
            ),
        )


    try:
        csv_content = summary_to_csv(LAST_ANALYSIS)
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=500,
            detail="No se pudieron preparar los resultados.",
        ) from error


    return Response(
        content=csv_content,

        media_type="text/csv",

        headers={
            "Content-Disposition":
                (
                    "attachment; "
                    'filename="results.csv"'
                )
        },
    )
