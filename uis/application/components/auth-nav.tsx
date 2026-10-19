"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";

import { getToken, logout } from "@/lib/auth";
import { useState } from "react";
import { ThemeToggleButton } from "@/components/theme-provider";


export default function AuthNav() {
  const pathname = usePathname();

  const [sessionPath, setSessionPath] = useState(pathname);
  const [hasSession, setHasSession] = useState(Boolean(getToken()));

  if (sessionPath !== pathname) {
    setSessionPath(pathname);
    setHasSession(Boolean(getToken()));
  }

  if (!hasSession) {
    return (
      <nav className="navGroup">
        <Link href="/login" className="navLink">
          Entrar
        </Link>

        <Link href="/register" className="navLink">
          Crear cuenta
        </Link>

        <ThemeToggleButton />
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

      <ThemeToggleButton />

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
