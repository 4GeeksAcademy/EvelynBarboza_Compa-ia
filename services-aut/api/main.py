import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from auth import router as auth_router
from profiles import router as profiles_router
from users import router as users_router


app = FastAPI(
    title="Company API"
)
 

app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(auth_router)

logger = logging.getLogger(__name__)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.exception("Error inesperado procesando la solicitud")
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrio un error interno. Intenta nuevamente."},
    )


@app.get("/")
def home():
    return {
        "message": "API funcionando"
    }
