"use client";


import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { LOGIN_PATH, PUBLIC_AUTH_ROUTES, getAuthToken } from "@/lib/auth";


export default function AuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isPublic && !getAuthToken()) {
      router.replace(LOGIN_PATH);
    }
  }, [isPublic, pathname, router]);

  if (isPublic || Boolean(getAuthToken())) {
    return <>{children}</>;
  }

  return <div className="authPage"><p className="authSubtitle">Verificando sesion...</p></div>;
}
