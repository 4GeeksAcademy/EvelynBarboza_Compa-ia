"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LOGIN_ROUTE, getToken } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/register"];

export function AuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  const [allowed, setAllowed] = useState(isPublic);

  useEffect(() => {
    if (isPublic) {
      setAllowed(true);

      return;
    }

    if (!getToken()) {
      setAllowed(false);
      router.replace(LOGIN_ROUTE);

      return;
    }

    setAllowed(true);
  }, [isPublic, pathname, router]);

  if (!allowed) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="text-sm text-neutral-500">Verificando sesion...</p>
      </main>
    );
  }

  return <>{children}</>;
}
