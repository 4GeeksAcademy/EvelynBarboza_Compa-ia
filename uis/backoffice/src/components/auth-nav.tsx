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

function isActiveRoute(pathname: string, href: string, includeChildren = false) {
  const currentPath = pathname.replace(/^\/backoffice(?=\/|$)/, "") || "/";
  return currentPath === href || (includeChildren && currentPath.startsWith(`${href}/`));
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
      <Link
        href="/"
        className={isActiveRoute(pathname, "/") ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/") ? "page" : undefined}
      >
        Inicio
      </Link>

      <Link
        href="/incidents"
        className={isActiveRoute(pathname, "/incidents") ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/incidents") ? "page" : undefined}
      >
        Incidencias
      </Link>

      <Link
        href="/suppliers"
        className={isActiveRoute(pathname, "/suppliers", true) ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/suppliers", true) ? "page" : undefined}
      >
        Proveedores
      </Link>

      <Link
        href="/inventory/products"
        className={isActiveRoute(pathname, "/inventory", true) ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/inventory", true) ? "page" : undefined}
      >
        Inventario
      </Link>

      <Link
        href="/incidents/dashboard"
        className={isActiveRoute(pathname, "/incidents/dashboard") ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/incidents/dashboard") ? "page" : undefined}
      >
        Panel de incidencias
      </Link>

      <Link
        href="/incidents/new"
        className={isActiveRoute(pathname, "/incidents/new") ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/incidents/new") ? "page" : undefined}
      >
        Registrar incidencia
      </Link>

      <Link
        href="/account/profile"
        className={isActiveRoute(pathname, "/account/profile") ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/account/profile") ? "page" : undefined}
      >
        Mi perfil
      </Link>

      {isAdmin && (
        <Link
          href="/employees"
          className={isActiveRoute(pathname, "/employees") ? "navLinkActive" : undefined}
          aria-current={isActiveRoute(pathname, "/employees") ? "page" : undefined}
        >
          Alta de empleados
        </Link>
      )}
      {error && <span role="alert">{error}</span>}

      <ThemeToggleButton />

      <Link
        href="/account/change-password"
        className={isActiveRoute(pathname, "/account/change-password") ? "navLinkActive" : undefined}
        aria-current={isActiveRoute(pathname, "/account/change-password") ? "page" : undefined}
      >
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
