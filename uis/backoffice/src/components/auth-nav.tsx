"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { PUBLIC_AUTH_ROUTES, getCurrentUser, getToken, logout } from "@/lib/auth";
import { ThemeToggleButton } from "@/components/theme-provider";


function subscribeToSession(onChange: () => void) {
  window.addEventListener("trackflow-auth-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("trackflow-auth-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getServerToken(): null {
  return null;
}

export default function AuthNav() {
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeToSession, getToken, getServerToken);
  const hasSession = Boolean(token) && !PUBLIC_AUTH_ROUTES.includes(pathname);
  const [permissions, setPermissions] = useState<{
    token: string | null;
    pathname: string;
    isAdmin: boolean;
    error: string;
  } | null>(null);
  const currentPermissions = permissions?.token === token && permissions?.pathname === pathname
    ? permissions
    : null;
  const isAdmin = currentPermissions?.isAdmin ?? false;
  const error = currentPermissions?.error ?? "";

  useEffect(() => {
    let active = true;
    if (hasSession) {
      getCurrentUser()
        .then((user) => {
          if (active) {
            setPermissions({ token, pathname, isAdmin: user.role === "admin", error: "" });
          }
        })
        .catch((caught: unknown) => {
          if (active) {
            setPermissions({
              token,
              pathname,
              isAdmin: false,
              error: caught instanceof Error ? caught.message : "No se pudieron comprobar los permisos.",
            });
          }
        });
    }
    return () => { active = false; };
  }, [hasSession, pathname, token]);

  if (!hasSession) {
    return (
      <div className="navLinks">
        <Link href="/login">
          Entrar
        </Link>

        <ThemeToggleButton />
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

      <Link href="/suppliers">
        Proveedores
      </Link>

      <Link href="/inventory/products">
        Inventario
      </Link>

      <Link href="/incidents/dashboard">
        Panel de incidencias
      </Link>

      <Link href="/incidents/new">
        Registrar incidencia
      </Link>

      <Link href="/account/profile">
        Mi perfil
      </Link>

      {isAdmin && <Link href="/employees">Alta de empleados</Link>}
      {error && <span role="alert">{error}</span>}

      <ThemeToggleButton />

      <Link href="/account/change-password">
        Cambiar contraseña
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
