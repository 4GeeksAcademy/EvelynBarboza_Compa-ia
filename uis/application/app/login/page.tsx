"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, HOME_ROUTE, login } from "@/lib/auth";


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);

      router.replace(HOME_ROUTE);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No se pudo iniciar sesion.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page authPage">
      <section className="card">
        <h1 className="title">
          Iniciar sesion
        </h1>

        <p className="subtitle">
          Accede con tu email y contrasena.
        </p>

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

          <div className="field">
            <label htmlFor="password">
              Contrasena
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

          {error ? (
            <p className="feedback feedbackError">
              {error}
            </p>
          ) : null}

          <p className="authFooter">
            <Link href="/forgot-password" className="authLink">
              Olvidaste tu contrasena?
            </Link>
          </p>

          <div className="actions">
            <button
              type="submit"
              className="button buttonPrimary"
              disabled={submitting}
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>

        <p className="muted authFooter">
          No tenes cuenta?{" "}
          <Link href="/register" className="authLink">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}
