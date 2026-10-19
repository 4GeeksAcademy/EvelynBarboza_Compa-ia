"use client";

import dynamic from "next/dynamic";

const IncidentDashboard = dynamic(
  () => import("@/components/incidents/IncidentDashboard"),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: 480 }} role="status">Cargando panel...</div>,
  },
);


export default function IncidentsDashboardPage() {
  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">OPERACIONES / INCIDENCIAS</span>
        <h1>Panel de incidencias</h1>
        <p>Seguimiento, estados y distribución de incidencias registradas.</p>
      </header>

      <IncidentDashboard />
    </main>
  );
}