"use client";

import { useEffect, useState } from "react";

import { getCurrentUser, registerUser, type RegisterPayload } from "@/lib/auth";

const EMPTY_FORM = { email: "", password: "", name: "", phone: "", address: "" };
const FIELDS = [
  { key: "email", label: "Email", type: "email", required: true },
  { key: "name", label: "Nombre", type: "text", required: true },
  { key: "phone", label: "Telefono", type: "tel", required: true },
  { key: "address", label: "Direccion", type: "text", required: false },
  { key: "password", label: "Contrasena inicial", type: "password", required: true },
] as const;

export default function EmployeesPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (!active) return;
        setIsAdmin(user.role === "admin");
        if (user.role !== "admin") setError("Solo un administrador puede dar de alta empleados.");
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "No se pudieron comprobar los permisos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload: RegisterPayload = {
        ...form,
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      await registerUser(payload);
      setForm(EMPTY_FORM);
      setSuccess("Empleado creado. Podra acceder con su email y contrasena inicial.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el empleado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Alta de empleados</h1>
        <p className="subtitle">Alta de empleados desde una cuenta administradora.</p>
        {loading && <p>Comprobando permisos...</p>}
        {error && <p className="feedback feedbackError" role="alert">{error}</p>}
        {success && <p className="feedback feedbackSuccess" role="status">{success}</p>}
        {!loading && isAdmin && (
          <form onSubmit={handleSubmit}>
            <div className="controlsRow">
              {FIELDS.map(({ key, label, type, required }) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type={type}
                    required={required}
                    minLength={key === "password" ? 8 : undefined}
                    autoComplete={key === "password" ? "new-password" : undefined}
                    value={form[key]}
                    disabled={submitting}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="button" type="submit" disabled={submitting}>
                {submitting ? "Creando..." : "Crear empleado"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
