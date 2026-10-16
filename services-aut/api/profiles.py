from typing import Optional
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, StringConstraints

from auth import get_current_user
from services import (
    get_all_profiles,
    get_profile_by_user_id,
    update_profile
)
from schemas import MessageResponse, ProfileResponse


router = APIRouter(
    prefix="/profiles",
    tags=["profiles"]
)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class MyProfileUpdate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    phone: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    address: Optional[str] = None


def owner_or_admin(
    user_id: str,
    current_user: dict
):
    if (
        current_user["id"] != user_id
        and current_user["role"] != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="No tenés permiso"
        )


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    profile = get_profile_by_user_id(
        current_user["id"]
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Perfil no encontrado"
        )

    return profile


@router.put("/me", response_model=ProfileResponse)
def edit_my_profile(
    data: MyProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    changes = data.model_dump(
        exclude_none=True
    )

    return update_profile(
        current_user["id"],
        changes
    )


@router.get("", response_model=list[ProfileResponse])
def list_profiles(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Solo un admin puede listar perfiles"
        )

    return get_all_profiles()


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile_by_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    owner_or_admin(
        user_id,
        current_user
    )

    profile = get_profile_by_user_id(user_id)

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Perfil no encontrado"
        )

    return profile


@router.patch("/{user_id}", response_model=ProfileResponse)
def edit_profile_by_user(
    user_id: str,
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    owner_or_admin(
        user_id,
        current_user
    )

    changes = data.model_dump(
        exclude_none=True
    )

    profile = get_profile_by_user_id(user_id)

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Perfil no encontrado"
        )

    return update_profile(
        user_id,
        changes
    )
