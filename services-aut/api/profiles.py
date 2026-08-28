from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from services import (
    get_all_profiles,
    get_profile_by_user_id,
    update_profile
)


router = APIRouter(
    prefix="/profiles",
    tags=["profiles"]
)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
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


@router.get("/me")
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


@router.put("/me")
def edit_my_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    changes = data.model_dump(
        exclude_none=True
    )

    return update_profile(
        current_user["id"],
        changes
    )


@router.get("")
def list_profiles(
    current_user: dict = Depends(get_current_user)
):
    return get_all_profiles()


@router.get("/{user_id}")
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


@router.patch("/{user_id}")
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
