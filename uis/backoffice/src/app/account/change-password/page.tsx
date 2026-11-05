"use client";


import { useState } from "react";

import { ApiError, changePassword } from "@/lib/auth";


export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("La nueva contrasena y la confirmacion no coinciden.");

      return;
    }

    setSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Contrasena actualizada.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No se pudo actualizar la contrasena.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page authPage">
      <section className="card">
        <h1 className="title">
          Cambiar contrasena
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="currentPassword">
              Contrasena actual
            </label>

            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="newPassword">
              Nueva contrasena
            </label>

            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">
              Confirmar nueva contrasena
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          {error ? (
            <div className="feedback feedbackError">
              <span>{error}</span>
              <button type="button" onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          ) : null}

          {success ? (
            <p className="feedback feedbackSuccess">
              {success}
            </p>
          ) : null}

          <div className="actions">
            <button
              type="submit"
              className="button buttonPrimary"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Guardar contrasena"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
