"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { getToken, logout } from "@/lib/auth";

export function AuthNav() {
  const pathname = usePathname();

  const [sessionPath, setSessionPath] = useState(pathname);
  const [hasSession, setHasSession] = useState(Boolean(getToken()));

  if (sessionPath !== pathname) {
    setSessionPath(pathname);
    setHasSession(Boolean(getToken()));
  }

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-semibold tracking-tight">
          Talent Pipeline
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {hasSession ? (
            <>
              <Link href="/account/profile" className="hover:underline">
                Mi perfil
              </Link>

              <button
                type="button"
                className="hover:underline"
                onClick={() => logout()}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Entrar
              </Link>

              <Link href="/register" className="hover:underline">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
