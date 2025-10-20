"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authStore";

export function useRequireAdmin() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }
    if (!auth.isAdmin) {
      const search = searchParams?.toString();
      const next = pathname ? `${pathname}${search ? `?${search}` : ""}` : "/admin";
      const redirect = encodeURIComponent(next);
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [auth.isAdmin, auth.isReady, pathname, router, searchParams]);

  return auth;
}
