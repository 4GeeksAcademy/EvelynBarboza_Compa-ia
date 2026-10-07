from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from packages.shared import (
    validate_branch,
    validate_category,
    validate_description,
    validate_origin,
    validate_status,
    validate_title,
)


SupplierCountry = Literal["USA", "Spain"]
SupplierCurrency = Literal["USD", "EUR"]
SupplierStatus = Literal["active", "suspended"]
SupplierCategory = Literal[
    "carrier_last_mile",
    "carrier_international",
    "warehouse_supplies",
    "packaging_materials",
    "reverse_logistics",
    "fleet_maintenance",
    "it_and_wms_software",
    "cleaning_and_facilities",
]


class SupplierCreate(BaseModel):
    name: str
    country: SupplierCountry
    categories: list[SupplierCategory] = Field(min_length=1)
    rate_per_shipment: float = Field(gt=0)
    currency: SupplierCurrency
    status: SupplierStatus
    service_zone: str | None = None
    contact_email: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_country_currency(self):
        if self.country == "USA" and self.currency != "USD":
            raise ValueError("USA suppliers must use USD currency.")

        if self.country == "Spain" and self.currency != "EUR":
            raise ValueError("Spain suppliers must use EUR currency.")

        return self


class SupplierResponse(SupplierCreate):
    id: int
    updated_at: datetime


class SupplierRateUpdate(BaseModel):
    rate_per_shipment: float = Field(gt=0)


class SupplierStatusUpdate(BaseModel):
    status: SupplierStatus


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    description: str
    category: str
    status: str = "open"
    origin: str
    branch: str

    @field_validator("title")
    @classmethod
    def validate_title_field(cls, value: str) -> str:
        return validate_title(value)

    @field_validator("description")
    @classmethod
    def validate_description_field(cls, value: str) -> str:
        return validate_description(value)

    @field_validator("category")
    @classmethod
    def validate_category_field(cls, value: str) -> str:
        return validate_category(value)

    @field_validator("status")
    @classmethod
    def validate_status_field(cls, value: str) -> str:
        return validate_status(value)

    @field_validator("origin")
    @classmethod
    def validate_origin_field(cls, value: str) -> str:
        return validate_origin(value)

    @field_validator("branch")
    @classmethod
    def validate_branch_field(cls, value: str) -> str:
        return validate_branch(value)


class Incident(IncidentCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class IncidentResponse(Incident):
    pass


class IncidentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status_field(cls, value: str) -> str:
        return validate_status(value)


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_origin: dict[str, int]
    by_branch: dict[str, int]


class IncidentValidationError(BaseModel):
    error: Literal["validation_error"] = "validation_error"
    field: str
    message: str


class IncidentNotFoundError(BaseModel):
    error: Literal["not_found"] = "not_found"
    message: str = "Incidencia no encontrada"


class IncidentStatusTransitionError(BaseModel):
    error: Literal["invalid_status_transition"] = "invalid_status_transition"
    field: Literal["status"] = "status"
    message: str
