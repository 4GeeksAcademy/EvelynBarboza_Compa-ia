from datetime import datetime, timezone

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict, Field

from services.api.database import get_db


router = APIRouter(prefix="/api/commercial-inquiries", tags=["commercial"])


class CommercialInquiryCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    full_name: str = Field(min_length=5, max_length=200)
    email: str = Field(
        max_length=254,
        pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$",
    )
    phone: str = Field(default="", max_length=50)
    address: str = Field(default="", max_length=500)
    inquiry: str = Field(default="", max_length=5000)


class CommercialInquiryResponse(BaseModel):
    id: int
    message: str


@router.post(
    "",
    response_model=CommercialInquiryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_commercial_inquiry(payload: CommercialInquiryCreate):
    with get_db() as db:
        inquiry_id = db.table("commercial_inquiries").insert({
            **payload.model_dump(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {
        "id": inquiry_id,
        "message": "Consulta comercial recibida.",
    }
