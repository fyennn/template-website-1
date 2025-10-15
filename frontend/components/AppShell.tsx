"use client";

import { useEffect } from "react";
import { NAVIGATION } from "@/lib/navigation";
import { setupMotionEffects } from "@/lib/motion";
import { useNavigationWithIcons } from "@/hooks/useNavigationWithIcons";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CategoryPills } from "./CategoryPills";
import { CartFab } from "./CartFab";

export type AppShellProps = {
  activeSlug: string;
  children: React.ReactNode;
  hideNavigation?: boolean;
  hideSearch?: boolean;
};

export function AppShell({
  activeSlug,
  children,
  hideNavigation = false,
  hideSearch = false,
  title,
  hideCartFab = false,
  backHref,
  hideLocation = false,
}: AppShellProps & {
  title?: string;
  hideCartFab?: boolean;
  backHref?: string;
  hideLocation?: boolean;
}) {
  useEffect(() => {
    const cleanup = setupMotionEffects();
    return () => cleanup();
  }, [activeSlug]);

  const navigationItems = useNavigationWithIcons(NAVIGATION);

  return (
    <div className="max-w-7xl mx-auto md:flex md:items-start md:min-h-screen">
      {!hideNavigation ? (
        <Sidebar items={navigationItems} activeSlug={activeSlug} />
      ) : null}
      <div className="flex-1 min-w-0">
        <div
          className="sticky top-0 z-30 bg-white"
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <Header
            hideSearch={hideSearch}
            hideLocation={hideLocation}
            title={title}
            backHref={backHref}
          />
          {!hideNavigation ? (
            <CategoryPills items={navigationItems} activeSlug={activeSlug} />
          ) : null}
        </div>
        {children}
        {!hideCartFab ? <CartFab /> : null}
      </div>
    </div>
  );
}
