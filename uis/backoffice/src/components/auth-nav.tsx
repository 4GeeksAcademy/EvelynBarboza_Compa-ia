"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getToken, logout } from "@/lib/auth";


export default function AuthNav() {
  const pathname = usePathname();

  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(getToken()));
  }, [pathname]);

  if (!hasSession) {
    return (
      <div className="navLinks">
        <Link href="/login">
          Entrar
        </Link>

        <Link href="/register">
          Crear cuenta
        </Link>
      </div>
    );
  }

  return (
    <div className="navLinks">
      <Link href="/">
        Inicio
      </Link>

      <Link href="/incidents">
        Incidencias
      </Link>

      <Link href="/account/profile">
        Mi perfil
      </Link>

      <button
        type="button"
        className="navLogout"
        onClick={() => logout()}
      >
        Salir
      </button>
    </div>
  );
}
