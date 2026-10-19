import type {
  Metadata
} from "next";


import Link from "next/link";

import AuthGuard from "@/components/auth-guard";
import AuthNav from "@/components/auth-nav";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";


export const metadata: Metadata = {
  title: "TrackFlow Suppliers",
  description: "Directorio de proveedores de TrackFlow",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <header className="topbar">
            <div className="topbarInner">
              <Link href="/" className="brand" aria-label="TrackFlow, inicio">
                <span className="brandTrack">Track</span><span className="brandFlow">Flow</span><span className="brandDot">.</span>
              </Link>

              <AuthNav />
            </div>
          </header>

          <AuthGuard>
            {children}
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
