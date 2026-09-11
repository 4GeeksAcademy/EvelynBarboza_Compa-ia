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
    <main className="authPage">
      <h1 className="authTitle">
        Iniciar sesion
      </h1>

      <p className="authSubtitle">
        Accede con tu email y contrasena.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="authField">
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

        <div className="authField">
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
          <div className="authError">
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : null}

        <button type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="authFooter">
        No tenes cuenta?{" "}
        <Link href="/register" className="authLink">
          Crear cuenta
        </Link>
      </p>
    </main>
  );
}
