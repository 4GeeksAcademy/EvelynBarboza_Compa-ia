export const INCIDENT_CATEGORIES = [
  "lost_parcel",
  "delivery_failure",
  "inventory_discrepancy",
  "carrier_issue",
  "returns_issue",
  "warehouse_incident",
  "system_failure",
  "client_complaint",
  "other",
] as const;

export const INCIDENT_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "discarded",
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_ORIGINS = ["customer", "branch", "internal"] as const;

export const INCIDENT_BRANCHES = [
  "central",
  "la_warehouse",
  "la_office",
  "zaragoza_warehouse",
  "zaragoza_office",
] as const;

export type IncidentField =
  | "title"
  | "description"
  | "category"
  | "status"
  | "origin"
  | "branch";

export type IncidentCreate = Omit<Record<IncidentField, string>, "status"> & {
  status: IncidentStatus;
};

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];
export type IncidentOrigin = (typeof INCIDENT_ORIGINS)[number];
export type IncidentBranch = (typeof INCIDENT_BRANCHES)[number];

export type Incident = IncidentCreate & {
  id: number;
  created_at: string;
  updated_at: string;
};

export type IncidentFilters = Partial<
  Pick<IncidentCreate, "status">
> & Partial<{
  origin: IncidentOrigin;
  branch: IncidentBranch;
  category: IncidentCategory;
}>;

export type IncidentSummary = {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_origin: Record<string, number>;
  by_branch: Record<string, number>;
};

export class IncidentApiError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "IncidentApiError";
    this.field = field;
  }
}

async function incidentsFetch<T>(
  path: string,
  init: RequestInit = {},
  fallback = "No se pudo completar la operación. Intenta nuevamente.",
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/backend/api/incidents${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new IncidentApiError("No se pudo conectar con el servidor.");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = typeof data === "object" && data !== null
      ? data as { field?: unknown; message?: unknown }
      : {};
    const field = typeof errorData.field === "string"
      ? errorData.field
      : undefined;
    const message = typeof errorData.message === "string"
      ? errorData.message
      : fallback;
    throw new IncidentApiError(message, field);
  }

  return data as T;
}

export function createIncident(payload: IncidentCreate): Promise<Incident> {
  return incidentsFetch<Incident>(
    "",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "No se pudo registrar la incidencia. Intenta nuevamente.",
  );
}

export function getIncidents(filters: IncidentFilters = {}): Promise<Incident[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  const queryString = query.toString();
  const search = queryString ? `?${queryString}` : "";
  return incidentsFetch<Incident[]>(search, {}, "No pudimos cargar las incidencias.");
}

export function getIncidentSummary(): Promise<IncidentSummary> {
  return incidentsFetch<IncidentSummary>("/summary", {}, "No se pudo cargar el resumen.");
}

export function updateIncidentStatus(
  id: number,
  status: IncidentStatus,
): Promise<Incident> {
  return incidentsFetch<Incident>(
    `/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "No se pudo actualizar el estado.",
  );
}