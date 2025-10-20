"use client";

import type { ReactNode } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function CashierLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isReady } = useRequireAdmin();

  if (!isReady || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
