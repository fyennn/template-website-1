"use client";

import { useEffect } from "react";
import { NAVIGATION } from "@/lib/navigation";
import { setupMotionEffects } from "@/lib/motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CategoryPills } from "./CategoryPills";
import { CartFab } from "./CartFab";

export type AppShellProps = {
  activeSlug: string;
  children: React.ReactNode;
};

export function AppShell({ activeSlug, children }: AppShellProps) {
  useEffect(() => {
    const cleanup = setupMotionEffects();
    return () => cleanup();
  }, [activeSlug]);

  return (
    <div className="max-w-7xl mx-auto flex">
      <Sidebar items={NAVIGATION} activeSlug={activeSlug} />
      <div className="flex-1 min-w-0">
        <Header />
        <CategoryPills items={NAVIGATION} activeSlug={activeSlug} />
        {children}
        <CartFab />
      </div>
    </div>
  );
}
