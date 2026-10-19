import logging
import os
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel

from auth import router as auth_router
from database import engine
from profiles import router as profiles_router
from routers.inventory import router as inventory_router
from schemas import HealthResponse
from users import router as users_router
import models


app = FastAPI(
    title="Company API"
)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

codespace_name = os.getenv("CODESPACE_NAME")
codespaces_domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN")
if codespace_name and codespaces_domain:
    allowed_origins.append(
        f"https://{codespace_name}-3000.{codespaces_domain}"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 

app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(auth_router)

SQLModel.metadata.create_all(engine)

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


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.exception("Error inesperado procesando la solicitud")
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrio un error interno. Intenta nuevamente."},
    )


@app.get("/", response_model=HealthResponse)
def home():
    return {
        "message": "API funcionando"
    }
