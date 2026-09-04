import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.hash import bcrypt
from pydantic import BaseModel


from email_service import send_reset_email
from services import (
    create_reset_token,
    get_profile_by_user_id,
    get_reset_token,
    get_user_by_email,
    get_user_by_id,
    mark_reset_token_used,
    update_user
)


load_dotenv()


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

RESET_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30")
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def create_access_token(user_id: str):
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expiration
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=ALGORITHM
    )


def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        user = get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no válido"
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )


@router.post("/login")
def login(
    form: OAuth2PasswordRequestForm = Depends()
):
    # Swagger llama "username" al campo.
    # Nosotros usamos ese campo para enviar el email.

    user = get_user_by_email(form.username)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )

    if not bcrypt.verify(
        form.password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )

    token = create_access_token(
        user["id"]
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user)
):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "profile": get_profile_by_user_id(
            current_user["id"]
        )
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    user = get_user_by_email(data.email)

    if user:
        jti = str(uuid4())

        expiration = datetime.now(timezone.utc) + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )

        token = jwt.encode(
            {
                "sub": user["id"],
                "jti": jti,
                "purpose": "reset",
                "exp": expiration
            },
            JWT_SECRET,
            algorithm=ALGORITHM
        )

        create_reset_token({
            "jti": jti,
            "user_id": user["id"],
            "used": False
        })

        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

        try:
            send_reset_email(user["email"], reset_link)
        except Exception:
            # No se filtra el error de envio: la respuesta siempre es 200.
            pass

    # Siempre 200: no revela si el email esta registrado.
    return {
        "message": "Si esa direccion esta registrada, recibiras un enlace en breve."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    try:
        payload = jwt.decode(
            data.token,
            JWT_SECRET,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="Token invalido o expirado"
        )

    if payload.get("purpose") != "reset":
        raise HTTPException(
            status_code=400,
            detail="Token invalido o expirado"
        )

    jti = payload.get("jti")
    stored_token = get_reset_token(jti)

    if not stored_token or stored_token["used"]:
        raise HTTPException(
            status_code=400,
            detail="Token invalido o expirado"
        )

    user_id = payload.get("sub")
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Token invalido o expirado"
        )

    update_user(
        user_id,
        {"hashed_password": bcrypt.hash(data.new_password)}
    )

    mark_reset_token_used(jti)

    return {
        "message": "Contrasena actualizada correctamente"
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    if not bcrypt.verify(
        data.current_password,
        current_user["hashed_password"]
    ):
        raise HTTPException(
            status_code=400,
            detail="La contrasena actual es incorrecta"
        )

    update_user(
        current_user["id"],
        {"hashed_password": bcrypt.hash(data.new_password)}
    )

    return {
        "message": "Contrasena actualizada correctamente"
    }
