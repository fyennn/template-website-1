"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import { isRouteAllowedForRole, ROLE_DEFAULT_ROUTES } from "@/lib/adminUsers";

export function useRequireAdmin() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }
    if (!auth.user) {
      const search = searchParams?.toString();
      const next = pathname ? `${pathname}${search ? `?${search}` : ""}` : "/admin";
      const redirect = encodeURIComponent(next);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    const currentPath = pathname || "/";
    if (!isRouteAllowedForRole(currentPath, auth.user.role)) {
      const fallback = auth.user.defaultRoute || ROLE_DEFAULT_ROUTES[auth.user.role] || "/admin";
      if (currentPath !== fallback) {
        router.replace(fallback);
      }
    }
  }, [auth.user, auth.isReady, pathname, router, searchParams]);

  return { ...auth, isAdmin: Boolean(auth.user) };
}
