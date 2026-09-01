"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ApiError,
  HOME_ROUTE,
  login,
  registerUser,
} from "@/lib/auth";


export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
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
    <main className="authPage">
      <h1 className="authTitle">
        Crear cuenta
      </h1>

      <p className="authSubtitle">
        El nombre, telefono y direccion son opcionales.
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

          {fieldErrors.email ? (
            <span className="authFieldError">
              {fieldErrors.email}
            </span>
          ) : null}
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

          {fieldErrors.password ? (
            <span className="authFieldError">
              {fieldErrors.password}
            </span>
          ) : null}
        </div>

        <div className="authField">
          <label htmlFor="name">
            Nombre
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          {fieldErrors.name ? (
            <span className="authFieldError">
              {fieldErrors.name}
            </span>
          ) : null}
        </div>

        <div className="authField">
          <label htmlFor="phone">
            Telefono
          </label>

          <input
            id="phone"
            name="phone"
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          {fieldErrors.phone ? (
            <span className="authFieldError">
              {fieldErrors.phone}
            </span>
          ) : null}
        </div>

        <div className="authField">
          <label htmlFor="address">
            Direccion
          </label>

          <input
            id="address"
            name="address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />

          {fieldErrors.address ? (
            <span className="authFieldError">
              {fieldErrors.address}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="authError">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="authFooter">
        Ya tenes cuenta?{" "}
        <Link href="/login" className="authLink">
          Iniciar sesion
        </Link>
      </p>
    </main>
  );
}
