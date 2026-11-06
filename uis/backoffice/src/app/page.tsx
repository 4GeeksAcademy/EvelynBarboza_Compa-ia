import Link from "next/link";


export default function Home() {

  return (

    <main className="container">

      <section className="hero">

        <span className="eyebrow">
          TRACKFLOW DIGITAL
        </span>


        <h1>
          Backoffice operativo
        </h1>


        <p>
          Herramientas internas
          para gestión y análisis
          de operaciones.
        </p>


        <div className="heroActions">
          <Link
            href="/incidents"
            className="button"
          >
            Analizar incidencias
          </Link>
          <Link
            href="/suppliers"
            className="button"
          >
            Gestionar proveedores
          </Link>
          <Link
            href="/inventory/products"
            className="button"
          >
            Gestionar inventario
          </Link>
        </div>

      </section>

    </main>

  );

}
