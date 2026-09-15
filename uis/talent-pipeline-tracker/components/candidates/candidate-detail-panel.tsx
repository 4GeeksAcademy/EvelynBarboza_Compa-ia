"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  createRecordNote,
  deleteRecordNote,
  getRecordById,
  getRecordNotes,
  replaceRecord,
} from "@/services";
import type { CandidateRecord, EntityId, JsonObject, RecordNote } from "@/types";
import {
  CandidateForm,
  type CandidateFormValues,
} from "@/components/candidates/candidate-form";

interface CandidateDetailPanelProps {
  initialCandidate: CandidateRecord;
  initialNotes: RecordNote[];
}

type NotesResponse =
  | RecordNote[]
  | { notes: RecordNote[] }
  | { data: RecordNote[] }
  | { results: RecordNote[] };

function getDisplayValue(value: unknown): string {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : "No disponible";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "No disponible";
}

function formatApplicationDate(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "No disponible";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function getCandidateName(candidate: CandidateRecord): string {
  if (typeof candidate.full_name === "string" && candidate.full_name.trim()) {
    return candidate.full_name;
  }

  if (typeof candidate.name === "string" && candidate.name.trim()) {
    return candidate.name;
  }

  return "No disponible";
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "No disponible";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function normalizeNotes(response: NotesResponse): RecordNote[] {
  if (Array.isArray(response)) {
    return response;
  }

  if ("notes" in response && Array.isArray(response.notes)) {
    return response.notes;
  }

  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }

  if ("results" in response && Array.isArray(response.results)) {
    return response.results;
  }

  return [];
}

function toDateTimeLocal(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const tzOffset = parsedDate.getTimezoneOffset() * 60000;
  const local = new Date(parsedDate.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

function toFormValues(candidate: CandidateRecord): CandidateFormValues {
  return {
    full_name: typeof candidate.full_name === "string" ? candidate.full_name : "",
    email: typeof candidate.email === "string" ? candidate.email : "",
    phone: typeof candidate.phone === "string" ? candidate.phone : "",
    position: typeof candidate.position === "string" ? candidate.position : "",
    linkedin_url:
      typeof candidate.linkedin_url === "string" ? candidate.linkedin_url : "",
    cv_url: typeof candidate.cv_url === "string" ? candidate.cv_url : "",
    experience_years:
      candidate.experience_years !== undefined
        ? String(candidate.experience_years)
        : "",
    status: typeof candidate.status === "string" ? candidate.status : "",
    stage: typeof candidate.stage === "string" ? candidate.stage : "",
    applied_at: toDateTimeLocal(candidate.applied_at),
  };
}

function buildCandidatePayload(values: CandidateFormValues): JsonObject {
  const payload: JsonObject = {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    position: values.position.trim(),
    status: values.status.trim(),
    stage: values.stage.trim(),
  };

  payload.linkedin_url = values.linkedin_url.trim() || null;
  payload.cv_url = values.cv_url.trim() || null;
  payload.experience_years = values.experience_years.trim()
    ? Number(values.experience_years)
    : 0;
  payload.applied_at = values.applied_at.trim()
    ? new Date(values.applied_at).toISOString()
    : null;

  return payload;
}

function getLinkedinValue(candidate: CandidateRecord): unknown {
  if (typeof candidate.linkedin_url === "string") {
    return candidate.linkedin_url;
  }

  return candidate.linkedin;
}

function getExperienceValue(candidate: CandidateRecord): unknown {
  if (candidate.experience_years !== undefined) {
    return candidate.experience_years;
  }

  return candidate.years_experience;
}

export function CandidateDetailPanel({
  initialCandidate,
  initialNotes,
}: CandidateDetailPanelProps) {
  const [candidate, setCandidate] = useState<CandidateRecord>(initialCandidate);
  const [notes, setNotes] = useState<RecordNote[]>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [notesSuccessMessage, setNotesSuccessMessage] = useState("");
  const [notesErrorMessage, setNotesErrorMessage] = useState("");
  const [notesRetry, setNotesRetry] = useState<(() => void) | null>(null);

  const editInitialValues = useMemo(() => toFormValues(candidate), [candidate]);

  const refreshCandidate = async (candidateId: EntityId) => {
    const latestCandidate = await getRecordById<CandidateRecord>(candidateId);
    setCandidate(latestCandidate);
  };

  const refreshNotes = async (candidateId: EntityId) => {
    setIsNotesLoading(true);
    setNotesErrorMessage("");

    try {
      const notesResponse = await getRecordNotes<NotesResponse>(candidateId);
      const normalizedNotes = normalizeNotes(notesResponse);
      setNotes(normalizedNotes);
    } catch (error) {
      setNotesErrorMessage("No se pudieron cargar las notas. Intenta nuevamente.");
      setNotesRetry(() => () => { void refreshNotes(candidateId); });
    } finally {
      setIsNotesLoading(false);
    }
  };

  const handleEditCandidate = async (values: CandidateFormValues) => {
    await replaceRecord(candidate.id, buildCandidatePayload(values));
    await refreshCandidate(candidate.id);
  };

  const handleCreateNote = async () => {
    const content = newNoteContent.trim();

    if (content.length === 0) {
      setNotesErrorMessage("La nota no puede estar vacia.");
      setNotesSuccessMessage("");
      return;
    }

    setIsCreatingNote(true);
    setNotesErrorMessage("");
    setNotesSuccessMessage("");

    try {
      await createRecordNote(candidate.id, { content });
      setNewNoteContent("");
      await refreshNotes(candidate.id);
      setNotesSuccessMessage("Nota creada correctamente.");
    } catch (error) {
      setNotesErrorMessage("No se pudo crear la nota. Intenta nuevamente.");
      setNotesRetry(null);
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: EntityId) => {
    setDeletingNoteId(String(noteId));
    setNotesErrorMessage("");
    setNotesSuccessMessage("");

    try {
      await deleteRecordNote(candidate.id, noteId);
      await refreshNotes(candidate.id);
      setNotesSuccessMessage("Nota eliminada correctamente.");
    } catch (error) {
      setNotesErrorMessage("No se pudo eliminar la nota. Intenta nuevamente.");
      setNotesRetry(null);
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Detalle de candidatura</h1>
        <Link
          href="/"
          className="rounded-md border border-zinc-800 bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900"
        >
          Volver al listado
        </Link>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" value={getCandidateName(candidate)} />
          <Field label="Email" value={getDisplayValue(candidate.email)} />
          <Field label="Teléfono" value={getDisplayValue(candidate.phone)} />
          <Field label="Puesto" value={getDisplayValue(candidate.position)} />
          <Field label="LinkedIn" value={getDisplayValue(getLinkedinValue(candidate))} />
          <Field label="Enlace al CV" value={getDisplayValue(candidate.cv_url)} />
          <Field
            label="Años de experiencia"
            value={getDisplayValue(getExperienceValue(candidate))}
          />
          <Field label="Estado" value={getDisplayValue(candidate.status)} />
          <Field label="Etapa" value={getDisplayValue(candidate.stage)} />
          <Field
            label="Fecha de aplicación"
            value={formatApplicationDate(candidate.applied_at)}
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Editar candidatura</h2>
        <div className="mt-4">
          <CandidateForm
            key={[
              String(candidate.id),
              String(candidate.updated_at ?? ""),
              String(candidate.status ?? ""),
              String(candidate.stage ?? ""),
            ].join(":")}
            mode="edit"
            initialValues={editInitialValues}
            onSubmit={handleEditCandidate}
            submitLabel="Actualizar candidato"
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Notas</h2>

        <div className="mt-4">
          <label
            htmlFor="new-note"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Nueva nota
          </label>
          <textarea
            id="new-note"
            value={newNoteContent}
            onChange={(event) => {
              setNewNoteContent(event.target.value);
            }}
            rows={3}
            placeholder="Escribe una nota..."
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          />

          <button
            type="button"
            onClick={() => {
              void handleCreateNote();
            }}
            disabled={isCreatingNote || isNotesLoading}
            className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingNote ? "Guardando nota..." : "Agregar nota"}
          </button>
        </div>

        <div className="mt-5">
          {isNotesLoading ? (
            <p className="text-sm text-zinc-600">Cargando notas...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-zinc-600">Todavia no hay notas para este candidato.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={String(note.id)} className="rounded-lg border border-zinc-200 p-4">
                  <p className="text-sm text-zinc-900">{note.content}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500">
                      {formatDate(note.created_at)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteNote(note.id);
                      }}
                      disabled={deletingNoteId === String(note.id) || isNotesLoading}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingNoteId === String(note.id)
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {notesSuccessMessage ? (
            <p className="mt-3 text-sm font-medium text-emerald-700">{notesSuccessMessage}</p>
          ) : null}

          {notesErrorMessage ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-red-700">{notesErrorMessage}</p>
              {notesRetry ? (
                <button
                  type="button"
                  className="text-sm font-medium text-red-700 underline"
                  onClick={notesRetry}
                >
                  Reintentar
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <article>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-900">{value}</p>
    </article>
  );
}
