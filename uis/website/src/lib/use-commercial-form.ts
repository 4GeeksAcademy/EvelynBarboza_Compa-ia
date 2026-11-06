"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Language } from "./use-website";

const EMPTY_FIELDS = { fullName: "", email: "", phone: "", address: "", inquiry: "" };
type Field = keyof typeof EMPTY_FIELDS;
type RequiredField = "fullName" | "email";
type Message = "fullNameInvalid" | "emailInvalid" | "formError" | "formSuccess" | "serverError";

const messages: Record<Language, Record<Message, string>> = {
  es: {
    fullNameInvalid: "Escribe nombre y apellido con al menos 5 caracteres, usando letras, espacios, apostrofes o guiones.",
    emailInvalid: "Introduce un email de contacto valido.",
    formError: "Revisa los campos indicados antes de enviar.",
    formSuccess: "Consulta recibida. El equipo comercial podra contactarte. No se ha creado una cuenta de empleado.",
    serverError: "No se pudo enviar la consulta. Intentalo de nuevo.",
  },
  en: {
    fullNameInvalid: "Enter a full name of at least 5 characters using letters, spaces, apostrophes, or hyphens.",
    emailInvalid: "Enter a valid contact email.",
    formError: "Review the highlighted fields before submitting.",
    formSuccess: "Inquiry received. Our business team can contact you. No employee account was created.",
    serverError: "Could not send your inquiry. Please try again.",
  },
};

function isValid(field: RequiredField, value: string) {
  const trimmed = value.trim();
  return field === "fullName"
    ? trimmed.length >= 5 && trimmed.length <= 200 && /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/.test(trimmed)
    : trimmed.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function useCommercialForm(language: Language) {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Partial<Record<RequiredField, Message>>>({});
  const [notice, setNotice] = useState<{ key: Message; error: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const text = messages[language];

  useEffect(() => {
    if (notice && notice.key !== "formError") alertRef.current?.focus();
  }, [notice]);

  function focusName() {
    const input = formRef.current?.elements.namedItem("fullName");
    if (input instanceof HTMLInputElement) input.focus();
  }

  function updateField(key: Field, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    if (key === "fullName" || key === "email") {
      setErrors((current) => ({
        ...current,
        [key]: isValid(key, value) ? undefined : `${key}Invalid`,
      }));
    }
  }

  function clearForm() {
    if (busy.current) return;
    setFields(EMPTY_FIELDS);
    setErrors({});
    setNotice(null);
    focusName();
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setNotice(null);
    const invalid = (["fullName", "email"] as const).filter((key) => !isValid(key, fields[key]));
    setErrors({
      fullName: invalid.includes("fullName") ? "fullNameInvalid" : undefined,
      email: invalid.includes("email") ? "emailInvalid" : undefined,
    });
    if (invalid.length) {
      setNotice({ key: "formError", error: true });
      const input = formRef.current?.elements.namedItem(invalid[0]);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }

    busy.current = true;
    setSubmitting(true);
    try {
      const response = await fetch("/api/commercial-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fields.fullName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          address: fields.address.trim(),
          inquiry: fields.inquiry.trim(),
        }),
      });
      const data: unknown = await response.json();
      if (
        response.status !== 201 || typeof data !== "object" || data === null
        || !("id" in data) || !Number.isInteger(data.id)
      ) {
        throw new Error("Respuesta inesperada al enviar la consulta comercial.");
      }
      setFields(EMPTY_FIELDS);
      setErrors({});
      setNotice({ key: "formSuccess", error: false });
    } catch (error) {
      console.error("No se pudo enviar la consulta comercial.", error);
      setNotice({ key: "serverError", error: true });
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return {
    fields, errors, notice, submitting, formRef, alertRef, text,
    updateField, submitForm, clearForm,
  };
}
