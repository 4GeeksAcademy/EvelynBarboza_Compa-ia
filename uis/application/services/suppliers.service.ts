import type {
  DeleteSupplierResponse,
  Supplier,
  SupplierCategory,
  SupplierCountry,
  SupplierCreatePayload,
  SupplierRateUpdatePayload,
  SupplierStatusUpdatePayload,
} from "@/types/suppliers";


const API_BASE = "/backend";


function buildPath(path: string): string {
  return `${API_BASE}${path}`;
}


function toErrorMessage(data: unknown, status: number): string {
  if (
    typeof data === "object"
    && data !== null
    && "detail" in data
  ) {
    const detail = (data as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return "No se pudo completar la solicitud. Revisa los datos e inténtalo nuevamente.";
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (
            typeof item === "object"
            && item !== null
            && "msg" in item
          ) {
            return String(
              (item as { msg: unknown }).msg
            );
          }

          return null;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return "La solicitud contiene datos no válidos. Revisa los campos e inténtalo nuevamente.";
      }
    }
  }

  return "No se pudo completar la solicitud.";
}


async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      buildPath(path),
      {
        ...init,
        headers: {
          "Accept": "application/json",
          ...(init?.body
            ? { "Content-Type": "application/json" }
            : {}),
          ...init?.headers,
        },
      },
    );
  } catch {
    throw new Error(
      "Network error. Could not connect to backend.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  let payload: unknown = null;

  try {
    payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    throw new Error("El servidor devolvio una respuesta no valida.");
  }

  if (!response.ok) {
    throw new Error(
      toErrorMessage(payload, response.status),
    );
  }

  return payload as T;
}


export async function listSuppliers(filters?: {
  country?: SupplierCountry;
  category?: SupplierCategory;
}): Promise<Supplier[]> {
  const params = new URLSearchParams();

  if (filters?.country) {
    params.set("country", filters.country);
  }

  if (filters?.category) {
    params.set("category", filters.category);
  }

  const query = params.toString();

  return request<Supplier[]>(
    query ? `/suppliers?${query}` : "/suppliers",
    { method: "GET" },
  );
}


export async function getSupplierById(
  supplierId: number,
): Promise<Supplier> {
  return request<Supplier>(
    `/suppliers/${encodeURIComponent(String(supplierId))}`,
    { method: "GET" },
  );
}


export async function createSupplier(
  payload: SupplierCreatePayload,
): Promise<Supplier> {
  return request<Supplier>(
    "/suppliers",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export async function updateSupplierRate(
  supplierId: number,
  payload: SupplierRateUpdatePayload,
): Promise<Supplier> {
  return request<Supplier>(
    `/suppliers/${encodeURIComponent(String(supplierId))}/rate`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}


export async function updateSupplierStatus(
  supplierId: number,
  payload: SupplierStatusUpdatePayload,
): Promise<Supplier> {
  return request<Supplier>(
    `/suppliers/${encodeURIComponent(String(supplierId))}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}


export async function deleteSupplier(
  supplierId: number,
): Promise<DeleteSupplierResponse> {
  return request<DeleteSupplierResponse>(
    `/suppliers/${encodeURIComponent(String(supplierId))}`,
    { method: "DELETE" },
  );
}
