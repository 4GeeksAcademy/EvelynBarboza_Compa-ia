import type { EntityId, JsonObject } from "@/types";
import {
  type CreateNotePayload,
  type CreateRecordPayload,
  type ReplaceRecordPayload,
  type UpdateRecordPayload,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable.");
  }

  return API_BASE_URL.replace(/\/$/, "");
}

function buildUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

function toPathId(id: EntityId): string {
  return encodeURIComponent(String(id));
}

function withJsonHeaders(headers?: HeadersInit): Headers {
  const mergedHeaders = new Headers(headers);

  if (!mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (!mergedHeaders.has("Accept")) {
    mergedHeaders.set("Accept", "application/json");
  }

  return mergedHeaders;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: withJsonHeaders(init?.headers),
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as TResponse;
}

export async function getRecords<TResponse = unknown>(): Promise<TResponse> {
  return request<TResponse>("/records", {
    method: "GET",
  });
}

export async function getRecordById<TResponse = unknown>(
  recordId: EntityId
): Promise<TResponse> {
  return request<TResponse>(`/records/${toPathId(recordId)}`, {
    method: "GET",
  });
}

export async function createRecord<
  TBody extends CreateRecordPayload = CreateRecordPayload,
  TResponse = unknown,
>(payload: TBody): Promise<TResponse> {
  return request<TResponse>("/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function replaceRecord<
  TBody extends ReplaceRecordPayload = ReplaceRecordPayload,
  TResponse = unknown,
>(recordId: EntityId, payload: TBody): Promise<TResponse> {
  return request<TResponse>(`/records/${toPathId(recordId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateRecord<
  TBody extends UpdateRecordPayload = UpdateRecordPayload,
  TResponse = unknown,
>(recordId: EntityId, payload: TBody): Promise<TResponse> {
  return request<TResponse>(`/records/${toPathId(recordId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getRecordNotes<TResponse = unknown>(
  recordId: EntityId
): Promise<TResponse> {
  return request<TResponse>(`/records/${toPathId(recordId)}/notes`, {
    method: "GET",
  });
}

export async function createRecordNote<
  TBody extends CreateNotePayload = CreateNotePayload,
  TResponse = unknown,
>(recordId: EntityId, payload: TBody): Promise<TResponse> {
  return request<TResponse>(`/records/${toPathId(recordId)}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteRecordNote<TResponse = unknown>(
  recordId: EntityId,
  noteId: EntityId
): Promise<TResponse> {
  return request<TResponse>(
    `/records/${toPathId(recordId)}/notes/${toPathId(noteId)}`,
    {
      method: "DELETE",
    }
  );
}

export type RequestPayload = JsonObject;
