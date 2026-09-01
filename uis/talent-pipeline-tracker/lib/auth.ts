// El servicio de autenticacion es independiente del API de candidaturas.
const API_BASE = "/auth-backend";

const TOKEN_KEY = "talent_token";

export const LOGIN_ROUTE = "/login";

export const HOME_ROUTE = "/";

export type Profile = {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  role: string;
  profile: Profile | null;
};

export type ProfileUpdatePayload = {
  name?: string;
  phone?: string;
  address?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
};

export class ApiError extends Error {
  status: number;

  fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem(TOKEN_KEY);

  return token && token.length > 0 ? token : null;
}

export function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
}

function goToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.replace(LOGIN_ROUTE);
}

export function logout(): void {
  clearToken();
  goToLogin();
}

function readFieldErrors(detail: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!Array.isArray(detail)) {
    return fieldErrors;
  }

  for (const item of detail) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const entry = item as { loc?: unknown; msg?: unknown };

    if (!Array.isArray(entry.loc)) {
      continue;
    }

    const field = entry.loc[entry.loc.length - 1];

    if (typeof field === "string" && typeof entry.msg === "string") {
      fieldErrors[field] = entry.msg;
    }
  }

  return fieldErrors;
}

function toErrorMessage(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    const messages = Object.values(readFieldErrors(detail));

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return `La solicitud fallo con estado ${status}.`;
}

async function request<T>(
  path: string,
  init: RequestInit,
  withAuth: boolean,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (withAuth) {
    const token = getToken();

    if (!token) {
      goToLogin();

      throw new ApiError("Sesion no iniciada.", 401);
    }

    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  // Una respuesta 401 invalida la sesion guardada en localStorage.
  if (withAuth && response.status === 401) {
    clearToken();
    goToLogin();

    throw new ApiError("Sesion expirada.", 401);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? (data as { detail?: unknown }).detail
        : null;

    throw new ApiError(
      toErrorMessage(data, response.status),
      response.status,
      readFieldErrors(detail),
    );
  }

  return data as T;
}

export async function login(
  email: string,
  password: string,
): Promise<string> {
  // El backend expone OAuth2PasswordRequestForm: el email viaja en "username".
  const body = new URLSearchParams();

  body.set("username", email);
  body.set("password", password);

  const data = await request<{ access_token: string }>(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
    false,
  );

  setToken(data.access_token);

  return data.access_token;
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await request(
    "/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    false,
  );
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me", { method: "GET" }, true);
}

export async function updateMyProfile(
  changes: ProfileUpdatePayload,
): Promise<Profile> {
  return request<Profile>(
    "/profiles/me",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    },
    true,
  );
}
