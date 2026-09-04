"use client";


import Link from "next/link";
import { useState } from "react";

import { ApiError, forgotPassword } from "@/lib/auth";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await forgotPassword(email);

      setSubmitted(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No se pudo procesar la solicitud.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page authPage">
      <section className="card">
        <h1 className="title">
          Olvidaste tu contrasena
        </h1>

        <p className="subtitle">
          Ingresa tu email y te enviaremos un enlace para restablecerla.
        </p>

        {submitted ? (
          <p className="feedback feedbackSuccess">
            Si esa direccion esta registrada, recibiras un enlace en breve.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {error ? (
              <p className="feedback feedbackError">
                {error}
              </p>
            ) : null}

            <div className="actions">
              <button
                type="submit"
                className="button buttonPrimary"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar enlace"}
              </button>
            </div>
          </form>
        )}

        <p className="muted authFooter">
          <Link href="/login" className="authLink">
            Volver a iniciar sesion
          </Link>
        </p>
      </section>
    </main>
  );
}
