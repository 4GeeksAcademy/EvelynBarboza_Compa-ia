from collections import Counter
from json import JSONDecodeError

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from packages.shared import (
	VALID_BRANCHES,
	VALID_INCIDENT_CATEGORIES,
	VALID_INCIDENT_ORIGINS,
	VALID_INCIDENT_STATUSES,
	validate_branch,
	validate_category,
	validate_origin,
	validate_status,
)
from services.api.database import (
	create_incident,
	get_incident_by_id,
	list_incidents,
	update_incident_status,
)
from services.api.models import (
	IncidentCreate,
	IncidentNotFoundError,
	IncidentResponse,
	IncidentSummary,
	IncidentStatusTransitionError,
	IncidentStatusUpdate,
)


router = APIRouter(prefix="/api/incidents", tags=["incidents"])


REQUIRED_FIELD_MESSAGES = {
	"title": "El título es obligatorio",
	"description": "La descripción es obligatoria",
	"category": "La categoría es obligatoria",
	"origin": "El origen es obligatorio",
	"branch": "La sede es obligatoria",
}


def validation_error_response(field: str, message: str):
	return JSONResponse(
		status_code=status.HTTP_400_BAD_REQUEST,
		content={
			"error": "validation_error",
			"field": field,
			"message": message,
		},
	)


@router.post(
	"",
	response_model=IncidentResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_incident_endpoint(request: Request):
	try:
		payload = IncidentCreate.model_validate(await request.json())
	except ValidationError as error:
		first_error = error.errors()[0]
		field = str(first_error["loc"][0]) if first_error["loc"] else "body"
		if first_error["type"] == "missing":
			message = REQUIRED_FIELD_MESSAGES.get(field, "Campo obligatorio")
		else:
			context_error = first_error.get("ctx", {}).get("error")
			message = str(context_error or first_error["msg"])
		return validation_error_response(field, message)
	except (JSONDecodeError, UnicodeDecodeError):
		return validation_error_response("body", "JSON inválido")

	return create_incident(payload.model_dump())


@router.get("", response_model=list[IncidentResponse])
def list_incidents_endpoint(
	status: str | None = None,
	origin: str | None = None,
	branch: str | None = None,
	category: str | None = None,
):
	filters = {}
	for field, value, validator in (
		("status", status, validate_status),
		("origin", origin, validate_origin),
		("branch", branch, validate_branch),
		("category", category, validate_category),
	):
		if value is not None:
			try:
				filters[field] = validator(value)
			except ValueError as error:
				return validation_error_response(field, str(error))

	return list_incidents(**filters)


@router.get("/summary", response_model=IncidentSummary)
def incidents_summary_endpoint():
	incidents = list_incidents()
	if not incidents:
		return {
			"total": 0,
			"by_status": {},
			"by_category": {},
			"by_origin": {},
			"by_branch": {},
		}

	status_counts = Counter(incident["status"] for incident in incidents)
	category_counts = Counter(incident["category"] for incident in incidents)
	origin_counts = Counter(incident["origin"] for incident in incidents)
	branch_counts = Counter(incident["branch"] for incident in incidents)
	return {
		"total": len(incidents),
		"by_status": {
			value: status_counts.get(value, 0)
			for value in sorted(VALID_INCIDENT_STATUSES)
		},
		"by_category": {
			value: category_counts.get(value, 0)
			for value in sorted(VALID_INCIDENT_CATEGORIES)
		},
		"by_origin": {
			value: origin_counts.get(value, 0)
			for value in sorted(VALID_INCIDENT_ORIGINS)
		},
		"by_branch": {
			value: branch_counts.get(value, 0)
			for value in sorted(VALID_BRANCHES)
		},
	}


@router.get(
	"/{incident_id:int}",
	response_model=IncidentResponse,
	responses={404: {"model": IncidentNotFoundError}},
)
def get_incident_endpoint(incident_id: int):
	incident = get_incident_by_id(incident_id)
	if incident is None:
		return JSONResponse(
			status_code=status.HTTP_404_NOT_FOUND,
			content={
				"error": "not_found",
				"message": "Incidencia no encontrada",
			},
		)
	return incident


@router.patch(
	"/{incident_id:int}/status",
	response_model=IncidentResponse,
	responses={
		400: {"model": IncidentStatusTransitionError},
		404: {"model": IncidentNotFoundError},
	},
)
def update_incident_status_endpoint(
	incident_id: int,
	payload: IncidentStatusUpdate,
):
	try:
		incident = update_incident_status(incident_id, payload.status)
	except ValueError as error:
		return JSONResponse(
			status_code=status.HTTP_400_BAD_REQUEST,
			content={
				"error": "invalid_status_transition",
				"field": "status",
				"message": str(error),
			},
		)

	if incident is None:
		return JSONResponse(
			status_code=status.HTTP_404_NOT_FOUND,
			content={
				"error": "not_found",
				"message": "Incidencia no encontrada",
			},
		)
	return incident