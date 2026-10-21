import type {
  Metadata
} from "next";


import Link from "next/link";

import AuthGuard from "@/components/auth-guard";
import AuthNav from "@/components/auth-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_INIT_SCRIPT } from "@/lib/auth";

import "./globals.css";


export const metadata: Metadata = {

  title:
    "TrackFlow Backoffice",

  description:
    (
      "Panel interno "
      + "de TrackFlow"
    ),

};


export default function RootLayout({

  children,

}: Readonly<{

  children:
    React.ReactNode;

}>) {

  return (

    <html lang="es" suppressHydrationWarning>

      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>

      <body>

        <ThemeProvider>
          <nav className="navbar">

            <div className="navContent">

              <Link href="/" className="logo" aria-label="TrackFlow, inicio">
                <span className="brandTrack">Track</span><span className="brandFlow">Flow</span><span className="brandDot">.</span>
              </Link>


              <AuthNav />
            </div>

          </nav>


          <AuthGuard>
            {children}
          </AuthGuard>
        </ThemeProvider>

      </body>

    </html>

  );

}
