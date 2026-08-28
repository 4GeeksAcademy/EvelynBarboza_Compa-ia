import Link from "next/link";


export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <h1 className="title">
          Directorio de Proveedores
        </h1>

        <p className="subtitle">
          Acceso a gestion de proveedores de TrackFlow.
        </p>

        <div className="actions">
          <Link href="/suppliers" className="button buttonPrimary">
            Ir a proveedores
          </Link>
        </div>
      </section>
    </main>
  );
}
