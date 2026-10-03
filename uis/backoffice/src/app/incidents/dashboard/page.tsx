import IncidentDashboard from "@/components/incidents/IncidentDashboard";


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