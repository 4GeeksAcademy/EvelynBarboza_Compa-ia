"use client";


import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { LOGIN_ROUTE, getToken } from "@/lib/auth";


const PUBLIC_ROUTES = [
  "/login",
  "/register",
];


export default function AuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isPublic && !getToken()) {
      router.replace(LOGIN_ROUTE);
    }
  }, [isPublic, pathname, router]);

  if (isPublic || Boolean(getToken())) {
    return <>{children}</>;
  }

  return <main className="page"><section className="card"><p className="muted">Verificando sesion...</p></section></main>;
}
