"use client";

import { useState } from "react";

export interface CandidateFormValues {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
  status: string;
  stage: string;
  applied_at: string;
}

interface CandidateFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<CandidateFormValues>;
  onSubmit: (values: CandidateFormValues) => Promise<void>;
  submitLabel?: string;
  secondaryButtonLabel?: string;
  onSecondaryAction?: () => void;
}

interface ValidationErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: string;
  stage?: string;
  experience_years?: string;
  applied_at?: string;
}

const defaultValues: CandidateFormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
  status: "",
  stage: "",
  applied_at: "",
};

function toInitialState(
  initialValues?: Partial<CandidateFormValues>
): CandidateFormValues {
  return {
    ...defaultValues,
    ...initialValues,
  };
}

function validate(values: CandidateFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "El nombre completo es obligatorio.";
  }

  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Ingresa un email valido.";
  }

  if (!values.phone.trim()) {
    errors.phone = "El telefono es obligatorio.";
  }

  if (!values.position.trim()) {
    errors.position = "El puesto es obligatorio.";
  }

  if (!values.status.trim()) {
    errors.status = "El estado es obligatorio.";
  }

  if (!values.stage.trim()) {
    errors.stage = "La etapa es obligatoria.";
  }

  if (values.experience_years.trim()) {
    const parsedYears = Number(values.experience_years);

    if (Number.isNaN(parsedYears) || parsedYears < 0) {
      errors.experience_years =
        "Anios de experiencia debe ser un numero mayor o igual a 0.";
    }
  }

  if (values.applied_at.trim()) {
    const parsedDate = new Date(values.applied_at);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.applied_at = "La fecha de aplicacion no es valida.";
    }
  }

  return errors;
}

function hasRequiredFields(values: CandidateFormValues): boolean {
  const hasName = values.full_name.trim().length > 0;
  const hasEmail = values.email.trim().length > 0;
  const hasPhone = values.phone.trim().length > 0;
  const hasPosition = values.position.trim().length > 0;
  const hasStatus = values.status.trim().length > 0;
  const hasStage = values.stage.trim().length > 0;
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());

  return (
    hasName &&
    hasEmail &&
    hasPhone &&
    hasPosition &&
    hasStatus &&
    hasStage &&
    hasValidEmail
  );
}

export function CandidateForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
  secondaryButtonLabel,
  onSecondaryAction,
}: CandidateFormProps) {
  const [values, setValues] = useState<CandidateFormValues>(
    toInitialState(initialValues)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const defaultSubmitLabel =
    mode === "create" ? "Registrar candidato" : "Guardar cambios";

  const submitButtonLabel =
    submitLabel ??
    (mode === "create"
      ? hasRequiredFields(values)
        ? "Confirmar"
        : "Registrar Candidato"
      : defaultSubmitLabel);

  const handleFieldChange = (field: keyof CandidateFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const currentErrors = validate(values);

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await onSubmit(values);
      setSuccessMessage(
        mode === "create"
          ? "Candidatura registrada correctamente."
          : "Candidatura actualizada correctamente."
      );

      if (mode === "create") {
        setValues(defaultValues);
      }
    } catch (error) {
      setErrorMessage("No se pudo guardar la candidatura. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          id="full_name"
          label="Nombre completo"
          value={values.full_name}
          onChange={(value) => {
            handleFieldChange("full_name", value);
          }}
          error={errors.full_name}
          required
        />

        <InputField
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={(value) => {
            handleFieldChange("email", value);
          }}
          error={errors.email}
          required
        />

        <InputField
          id="phone"
          label="Telefono"
          value={values.phone}
          onChange={(value) => {
            handleFieldChange("phone", value);
          }}
          error={errors.phone}
          required
        />

        <InputField
          id="position"
          label="Puesto"
          value={values.position}
          onChange={(value) => {
            handleFieldChange("position", value);
          }}
          error={errors.position}
          required
        />

        <InputField
          id="status"
          label="Estado"
          value={values.status}
          onChange={(value) => {
            handleFieldChange("status", value);
          }}
          error={errors.status}
          required
        />

        <InputField
          id="stage"
          label="Etapa"
          value={values.stage}
          onChange={(value) => {
            handleFieldChange("stage", value);
          }}
          error={errors.stage}
          required
        />

        <InputField
          id="linkedin_url"
          label="LinkedIn"
          value={values.linkedin_url}
          onChange={(value) => {
            handleFieldChange("linkedin_url", value);
          }}
        />

        <InputField
          id="cv_url"
          label="Enlace CV"
          value={values.cv_url}
          onChange={(value) => {
            handleFieldChange("cv_url", value);
          }}
        />

        <InputField
          id="experience_years"
          label="Anios de experiencia"
          value={values.experience_years}
          onChange={(value) => {
            handleFieldChange("experience_years", value);
          }}
          error={errors.experience_years}
        />

        <InputField
          id="applied_at"
          label="Fecha de aplicacion"
          type="datetime-local"
          value={values.applied_at}
          onChange={(value) => {
            handleFieldChange("applied_at", value);
          }}
          error={errors.applied_at}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Guardando..." : submitButtonLabel}
        </button>

        {secondaryButtonLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            disabled={isSubmitting}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {secondaryButtonLabel}
          </button>
        ) : null}

        {successMessage ? (
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        ) : null}

        {errorMessage ? (
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        ) : null}
      </div>
    </form>
  );
}

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
}

function InputField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
}: InputFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
