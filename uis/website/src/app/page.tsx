import type { Metadata } from "next";
import Landing from "../components/landing";

export const metadata: Metadata = {
  "title": "TrackFlow | Logística Inteligente para E-commerce",
  "description": "TrackFlow conecta almacenes, transportistas y atención al cliente para acelerar entregas, reducir errores y escalar operaciones logísticas en Estados Unidos y España.",
  "robots": "index,follow,max-image-preview:large",
  "alternates": {
    "canonical": "/index.html",
    "languages": {
      "es": "/index.html"
    }
  },
  "openGraph": {
    "type": "website",
    "locale": "es_ES",
    "title": "TrackFlow | Logística Inteligente para E-commerce",
    "description": "Plataforma operativa para inventario unificado, selección de transportistas, devoluciones automatizadas y soporte al cliente.",
    "siteName": "TrackFlow"
  },
  "other": {
    "geo.region": "US-CA,ES-AR",
    "geo.placename": "Los Angeles; Zaragoza",
    "geo.position": "34.052235;-118.243683",
    "ICBM": "34.052235, -118.243683"
  },
  "keywords": "TrackFlow, logística de última milla, gestión de almacenes, e-commerce, tracking, devoluciones",
  "authors": [
    {
      "name": "TrackFlow"
    }
  ],
  "twitter": {
    "card": "summary_large_image",
    "title": "TrackFlow",
    "description": "Moderniza tu operación logística con datos en tiempo real y automatización inteligente."
  }
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TrackFlow",
    "url": "/index.html",
    "description": "Unidad tecnológica de TrackFlow para optimizar logística de última milla y almacenes.",
    "areaServed": [
      "US",
      "ES"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "availableLanguage": [
        "Spanish",
        "English"
      ]
    },
    "address": [
      {
        "@type": "PostalAddress",
        "addressLocality": "Los Ángeles",
        "addressRegion": "CA",
        "addressCountry": "US"
      },
      {
        "@type": "PostalAddress",
        "addressLocality": "Zaragoza",
        "addressRegion": "Aragón",
        "addressCountry": "ES"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TrackFlow",
    "url": "/index.html",
    "inLanguage": "es"
  }
];

export default function Page() {
  return <>
    {structuredData.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
    <Landing />
  </>;
}
