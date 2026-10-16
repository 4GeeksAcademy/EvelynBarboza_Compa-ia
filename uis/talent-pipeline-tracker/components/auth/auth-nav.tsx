"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { getToken, logout } from "@/lib/auth";
import { ThemeToggleButton } from "@/components/theme-provider";

export function AuthNav() {
  const pathname = usePathname();

  const [sessionPath, setSessionPath] = useState(pathname);
  const [hasSession, setHasSession] = useState(Boolean(getToken()));

  if (sessionPath !== pathname) {
    setSessionPath(pathname);
    setHasSession(Boolean(getToken()));
  }

  return (
    <header className="navbar">
      <div className="navContent">
        <Link href="/" className="brand" aria-label="TrackFlow, inicio">
          <span className="brandTrack">Track</span><span className="brandFlow">Flow</span><span className="brandDot">.</span>
        </Link>

        <nav className="navLinks">
          {hasSession ? (
            <>
              <ThemeToggleButton />
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
            </>
          ) : (
            <>
              <ThemeToggleButton />
              <Link href="/login">
                Entrar
              </Link>

              <Link href="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
