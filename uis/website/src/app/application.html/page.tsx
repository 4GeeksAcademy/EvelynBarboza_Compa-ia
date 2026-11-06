import type { Metadata } from "next";
import Commercial from "../../components/commercial";

export const metadata: Metadata = {
  "title": "Consulta comercial | TrackFlow Tech",
  "description": "Formulario de aplicación de TrackFlow Tech para iniciar diagnóstico logístico y activación de soluciones de última milla y almacenes.",
  "robots": "index,follow",
  "alternates": {
    "canonical": "/application.html",
    "languages": {
      "es": "/application.html"
    }
  },
  "openGraph": {
    "type": "website",
    "locale": "es_ES",
    "title": "Consulta comercial | TrackFlow Tech",
    "description": "Aplica al programa TrackFlow Tech en menos de 2 minutos con un formulario accesible y seguro."
  },
  "other": {
    "geo.region": "US-CA,ES-AR",
    "geo.placename": "Los Angeles; Zaragoza"
  }
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Formulario de aplicación TrackFlow Tech",
    "url": "/application.html",
    "inLanguage": "es",
    "about": {
      "@type": "Organization",
      "name": "TrackFlow Tech",
      "areaServed": [
        "US",
        "ES"
      ]
    }
  }
];

export default function Page() {
  return <>
    {structuredData.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
    <Commercial />
  </>;
}
