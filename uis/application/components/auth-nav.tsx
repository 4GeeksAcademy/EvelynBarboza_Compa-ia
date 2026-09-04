"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";

import { getToken, logout } from "@/lib/auth";
import { useEffect, useState } from "react";


export default function AuthNav() {
  const pathname = usePathname();

  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(getToken()));
  }, [pathname]);

  if (!hasSession) {
    return (
      <nav className="navGroup">
        <Link href="/login" className="navLink">
          Entrar
        </Link>

        <Link href="/register" className="navLink">
          Crear cuenta
        </Link>
      </nav>
    );
  }

  return (
    <nav className="navGroup">
      <Link href="/suppliers" className="navLink">
        Proveedores
      </Link>

      <Link href="/account/profile" className="navLink">
        Mi perfil
      </Link>

      <button
        type="button"
        className="navLink navButton"
        onClick={() => logout()}
      >
        Salir
      </button>
    </nav>
  );
}
