"use client";


import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ApiError, resetPassword } from "@/lib/auth";


function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");

      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(token, password);

      router.replace("/login?reset=success");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No se pudo restablecer la contrasena.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page authPage">
      <section className="card">
        <h1 className="title">
          Restablecer contrasena
        </h1>

        <p className="subtitle">
          Ingresa tu nueva contrasena.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">
              Nueva contrasena
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">
              Confirmar contrasena
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
            <div>
              <p className="feedback feedbackError">
                {error}
              </p>

              <p className="muted authFooter">
                <Link href="/forgot-password" className="authLink">
                  Solicitar un nuevo enlace
                </Link>
              </p>
            </div>
          ) : null}

          <div className="actions">
            <button
              type="submit"
              className="button buttonPrimary"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Restablecer contrasena"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
