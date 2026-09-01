import type {
  Metadata
} from "next";


import Link from "next/link";

import AuthGuard from "@/components/auth-guard";
import AuthNav from "@/components/auth-nav";

import "./globals.css";


export const metadata: Metadata = {
  title: "TrackFlow Suppliers",
  description: "Directorio de proveedores de TrackFlow",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <div className="topbarInner">
            <Link href="/" className="brand">
              TRACKFLOW
            </Link>

            <AuthNav />
          </div>
        </header>

        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
