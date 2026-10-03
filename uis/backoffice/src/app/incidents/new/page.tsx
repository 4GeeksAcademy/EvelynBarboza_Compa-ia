import IncidentForm from "@/components/incidents/IncidentForm";


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