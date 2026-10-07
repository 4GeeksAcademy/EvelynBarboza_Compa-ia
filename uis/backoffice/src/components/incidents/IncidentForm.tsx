"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  createIncident,
  INCIDENT_BRANCHES,
  INCIDENT_CATEGORIES,
  INCIDENT_ORIGINS,
  INCIDENT_STATUSES,
  IncidentApiError,
} from "@/lib/incidents";
import type { IncidentCreate, IncidentField } from "@/lib/incidents";

import styles from "./incident-form.module.css";


const INITIAL_FORM: IncidentCreate = {
  title: "",
  description: "",
  category: "",
  status: "open",
  origin: "",
  branch: "",
};

const FIELD_NAMES: IncidentField[] = [
  "title",
  "description",
  "category",
  "status",
  "origin",
  "branch",
];

function isIncidentField(value: string): value is IncidentField {
  return FIELD_NAMES.includes(value as IncidentField);
}


export default function IncidentForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<IncidentField, string>>>({});
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.currentTarget;
    if (!isIncidentField(name)) return;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setRequestError("");
    setSuccess("");
  }

  function validateForm() {
    const nextErrors: Partial<Record<IncidentField, string>> = {};

    if (!form.title.trim()) {
      nextErrors.title = "El título es obligatorio";
    } else if (form.title.trim().length > 120) {
      nextErrors.title = "El título no puede superar 120 caracteres";
    }
    if (!form.description.trim()) {
      nextErrors.description = "La descripción es obligatoria";
    }
    if (!form.category) nextErrors.category = "Seleccioná una categoría";
    if (!form.status) nextErrors.status = "Seleccioná un estado";
    if (!form.origin) nextErrors.origin = "Seleccioná un origen";
    if (!form.branch) nextErrors.branch = "Seleccioná una sede";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");
    setSuccess("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createIncident({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setForm(INITIAL_FORM);
      setErrors({});
      setSuccess("Incidencia registrada correctamente.");
    } catch (error) {
      if (error instanceof IncidentApiError && error.field && isIncidentField(error.field)) {
        setErrors({ [error.field]: error.message });
      } else if (error instanceof Error) {
        setRequestError(error.message);
      } else {
        setRequestError("Ocurrió un error inesperado. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={`${styles.field} ${styles.wide}`}>
        <label htmlFor="incident-title">Título <span>Obligatorio</span></label>
        <input
          id="incident-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          maxLength={120}
          required
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "incident-title-error" : undefined}
        />
        {errors.title && <p className={styles.fieldError} id="incident-title-error">{errors.title}</p>}
      </div>

      <div className={`${styles.field} ${styles.wide}`}>
        <label htmlFor="incident-description">Descripción <span>Obligatoria</span></label>
        <textarea
          id="incident-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          required
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "incident-description-error" : undefined}
        />
        {errors.description && <p className={styles.fieldError} id="incident-description-error">{errors.description}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="incident-category">Categoría <span>Obligatoria</span></label>
        <select
          id="incident-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "incident-category-error" : undefined}
        >
          <option value="">Seleccioná una categoría</option>
          {INCIDENT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        {errors.category && <p className={styles.fieldError} id="incident-category-error">{errors.category}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="incident-status">Estado <span>Obligatorio</span></label>
        <select
          id="incident-status"
          name="status"
          value={form.status}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.status)}
          aria-describedby={errors.status ? "incident-status-error" : undefined}
        >
          {INCIDENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        {errors.status && <p className={styles.fieldError} id="incident-status-error">{errors.status}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="incident-origin">Origen <span>Obligatorio</span></label>
        <select
          id="incident-origin"
          name="origin"
          value={form.origin}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.origin)}
          aria-describedby={errors.origin ? "incident-origin-error" : undefined}
        >
          <option value="">Seleccioná un origen</option>
          {INCIDENT_ORIGINS.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
        </select>
        {errors.origin && <p className={styles.fieldError} id="incident-origin-error">{errors.origin}</p>}
      </div>

      <div className={`${styles.field} ${form.origin === "branch" ? styles.branchRequired : ""}`}>
        <label htmlFor="incident-branch">Sede <span>Obligatoria</span></label>
        <select
          id="incident-branch"
          name="branch"
          value={form.branch}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.branch)}
          aria-describedby={[
            form.origin === "branch" ? "incident-branch-hint" : "",
            errors.branch ? "incident-branch-error" : "",
          ].filter(Boolean).join(" ") || undefined}
        >
          <option value="">Seleccioná una sede</option>
          {INCIDENT_BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
        </select>
        {form.origin === "branch" && (
          <p className={styles.branchHint} id="incident-branch-hint">
            Indicá desde qué sede se reporta la incidencia.
          </p>
        )}
        {errors.branch && <p className={styles.fieldError} id="incident-branch-error">{errors.branch}</p>}
      </div>

      {requestError && <p className={styles.requestError} role="alert">{requestError}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}

      <div className={`${styles.actions} ${styles.wide}`}>
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Crear incidencia"}
        </button>
        {loading && <span className={styles.loadingText} role="status">Guardando la incidencia…</span>}
      </div>
    </form>
  );
}