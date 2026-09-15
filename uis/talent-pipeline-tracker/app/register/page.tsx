"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, HOME_ROUTE, login, registerUser } from "@/lib/auth";

const INPUT_CLASS =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await registerUser({
        email,
        password,
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(address ? { address } : {}),
      });

      await login(email, password);

      router.replace(HOME_ROUTE);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors);
        setError(caught.message);
      } else {
        setError("No se pudo crear la cuenta.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>

      <p className="mt-1 text-sm text-neutral-500">
        El nombre, telefono y direccion son opcionales.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />

          {fieldErrors.email ? (
            <span className="text-xs text-red-700">{fieldErrors.email}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contrasena
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASS}
          />

          {fieldErrors.password ? (
            <span className="text-xs text-red-700">{fieldErrors.password}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_CLASS}
          />

          {fieldErrors.name ? (
            <span className="text-xs text-red-700">{fieldErrors.name}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Telefono
          </label>

          <input
            id="phone"
            name="phone"
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={INPUT_CLASS}
          />

          {fieldErrors.phone ? (
            <span className="text-xs text-red-700">{fieldErrors.phone}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">
            Direccion
          </label>

          <input
            id="address"
            name="address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={INPUT_CLASS}
          />

          {fieldErrors.address ? (
            <span className="text-xs text-red-700">{fieldErrors.address}</span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-500">
        Ya tenes cuenta?{" "}
        <Link href="/login" className="font-medium underline">
          Iniciar sesion
        </Link>
      </p>
    </main>
  );
}
