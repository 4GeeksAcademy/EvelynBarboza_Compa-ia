"use client";

import dynamic from "next/dynamic";

const IncidentForm = dynamic(
  () => import("@/components/incidents/IncidentForm"),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: 480 }} role="status">Cargando formulario...</div>,
  },
);


export default function NewIncidentPage() {
  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">OPERACIONES / INCIDENCIAS</span>
        <h1>Registrar incidencia</h1>
        <p>Registrá el problema y la sede responsable para darle seguimiento.</p>
      </header>

      <section className="card" aria-label="Datos de la incidencia">
        <IncidentForm />
      </section>
    </main>
  );
}