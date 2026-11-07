import logging
import sys
from contextlib import asynccontextmanager
from time import perf_counter
from pathlib import Path

from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import (
    JSONResponse,
    Response,
)

AUTH_API_DIR = Path(__file__).resolve().parents[2] / "services-aut" / "api"
if not AUTH_API_DIR.is_dir():
    raise RuntimeError(f"No se encontró el backend de autenticación: {AUTH_API_DIR}")
if str(AUTH_API_DIR) not in sys.path:
    sys.path.append(str(AUTH_API_DIR))

from packages.incidents_analysis import (
    analyze_csv_text,
    summary_to_csv,
)
from services.api.models import HealthResponse, IncidentAnalysisResponse
from services.api.routes.suppliers import (
    router as suppliers_router,
)
from services.api.routes.incidents import (
    router as incidents_router,
)
from services.api.routes.commercial import router as commercial_router
from auth import get_current_user, router as auth_router
from profiles import router as profiles_router
from routers.inventory import router as inventory_router
from users import router as users_router
from database import engine
from sqlmodel import SQLModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title=(
        "TrackFlow Backoffice API"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(commercial_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(
    suppliers_router,
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    incidents_router,
)
app.include_router(inventory_router)

logger = logging.getLogger(__name__)
timing_logger = logging.getLogger("api.timing")


@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    started = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - started) * 1000
    timing_logger.info(
        "%s %s %s %.2fms",
        request.method,
        request.scope.get("route").path if request.scope.get("route") else "/unmatched",
        response.status_code,
        elapsed_ms,
    )
    response.headers["Server-Timing"] = f"app;dur={elapsed_ms:.2f}"
    return response


@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    request: Request,
    exc: RequestValidationError,
):
    first_error = exc.errors()[0]
    location = first_error.get("loc", [])
    field = str(location[-1]) if location else "body"
    context_error = first_error.get("ctx", {}).get("error")
    message = str(context_error or first_error.get("msg", "Dato inválido"))
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "field": field,
            "message": message,
        },
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.exception("Error inesperado procesando la solicitud")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "Ocurrió un error inesperado",
        },
    )


LAST_ANALYSIS = None


@app.get("/", response_model=HealthResponse)
def root():

    return {
        "message":
            (
                "Trackflow Incidents "
                "API is running"
            )
    }


@app.post(
    "/api/incidents/analyze",
    response_model=IncidentAnalysisResponse,
)
async def analyze_incidents(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
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
    "/api/incidents/results/export",
    response_class=Response,
    dependencies=[Depends(get_current_user)],
    responses={
        200: {
            "content": {
                "text/csv": {
                    "schema": {"type": "string", "format": "binary"},
                },
            },
        },
    },
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
