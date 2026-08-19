from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


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
