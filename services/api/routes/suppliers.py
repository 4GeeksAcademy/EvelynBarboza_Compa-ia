from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from services.api.database import (
	create_supplier,
	delete_supplier,
	get_supplier_by_id,
	list_suppliers,
	update_supplier,
)
from services.api.models import (
	SupplierCategory,
	SupplierCountry,
	SupplierCreate,
	SupplierRateUpdate,
	SupplierResponse,
	SupplierStatusUpdate,
)


router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post(
	"",
	response_model=SupplierResponse,
	status_code=status.HTTP_201_CREATED,
)
def create_supplier_endpoint(
	payload: SupplierCreate,
):
	supplier_data = payload.model_dump()
	supplier_data["updated_at"] = (
		datetime.now(timezone.utc)
		.isoformat()
	)

	created_supplier = create_supplier(
		supplier_data
	)

	return SupplierResponse.model_validate(
		created_supplier
	)


@router.get(
	"",
	response_model=list[SupplierResponse],
)
def list_suppliers_endpoint(
	country: SupplierCountry | None = Query(default=None),
	category: SupplierCategory | None = Query(default=None),
):
	suppliers = list_suppliers(
		country=country,
		category=category,
	)

	return [
		SupplierResponse.model_validate(
			supplier
		)
		for supplier in suppliers
	]


@router.get(
	"/{supplier_id}",
	response_model=SupplierResponse,
)
def get_supplier_endpoint(
	supplier_id: int,
):
	supplier = get_supplier_by_id(
		supplier_id
	)

	if supplier is None:
		raise HTTPException(
			status_code=404,
			detail="Supplier not found.",
		)

	return SupplierResponse.model_validate(
		supplier
	)


@router.patch(
	"/{supplier_id}/rate",
	response_model=SupplierResponse,
)
def update_supplier_rate_endpoint(
	supplier_id: int,
	payload: SupplierRateUpdate,
):
	updated_supplier = update_supplier(
		supplier_id,
		{
			"rate_per_shipment": payload.rate_per_shipment,
			"updated_at": (
				datetime.now(timezone.utc)
				.isoformat()
			),
		},
	)

	if updated_supplier is None:
		raise HTTPException(
			status_code=404,
			detail="Supplier not found.",
		)

	return SupplierResponse.model_validate(
		updated_supplier
	)


@router.patch(
	"/{supplier_id}/status",
	response_model=SupplierResponse,
)
def update_supplier_status_endpoint(
	supplier_id: int,
	payload: SupplierStatusUpdate,
):
	updated_supplier = update_supplier(
		supplier_id,
		{
			"status": payload.status,
		},
	)

	if updated_supplier is None:
		raise HTTPException(
			status_code=404,
			detail="Supplier not found.",
		)

	return SupplierResponse.model_validate(
		updated_supplier
	)


@router.delete(
	"/{supplier_id}",
)
def delete_supplier_endpoint(
	supplier_id: int,
):
	deleted = delete_supplier(
		supplier_id
	)

	if not deleted:
		raise HTTPException(
			status_code=404,
			detail="Supplier not found.",
		)

	return {
		"message": "Supplier deleted successfully.",
	}
