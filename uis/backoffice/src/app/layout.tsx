import type {
  Metadata
} from "next";


import Link from "next/link";

import AuthGuard from "@/components/auth-guard";
import AuthNav from "@/components/auth-nav";

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

    <html lang="es">

      <body>

        <nav className="navbar">

          <div className="navContent">

            <Link
              href="/"
              className="logo"
            >
              TRACKFLOW
            </Link>


            <AuthNav />
          </div>

        </nav>


        <AuthGuard>
          {children}
        </AuthGuard>

      </body>

    </html>

  );

}
