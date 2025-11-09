import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { NavigationItem } from "@/lib/navigation";

export type SidebarProps = {
  items: NavigationItem[];
  activeSlug: string;
};

export function Sidebar({ items, activeSlug }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex w-64 bg-gradient-to-br from-[#ecf8f4] via-white to-[#f3fbf7] shadow-sm border-r border-emerald-50/70 md:sticky md:top-0 md:h-screen"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex h-full w-full flex-col">
        <div className="px-6 pb-4 pt-6 border-b border-emerald-100/60 bg-white/80 backdrop-blur">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsiHIdLAZymKywmghuMJ4DnMud2B6E1CzythChBRnHHYVHHbyl717uDSqWpl530JlSId2MxEhHz78ptp-CAGshOvKKeU9yud3F4M4aQ6eGYrrGAfZBnIse5F98soktjbyVpPmo_QeNCMUndjKVj8Tc4qNpY6Fd3XEJkiMJCiMi9BbOHNbuJvjmD_ePxe-FZuGXvShGRktUkdCK47mqzUCgo_fSHO3Kfbnef25GdcamaiYNuBKN1iyAT8Nv7P_0pTtXbuLOcKV1ObM"
            alt="AIVRA Logo"
            className="h-10 w-auto enter-animated enter-from-left enter-duration-short"
            data-animate-delay="40"
            width={160}
            height={40}
            priority
          />
        </div>
        <nav
          className="flex-1 overflow-y-auto py-6 px-2 flex flex-col gap-1"
          data-animate-group="category-desktop"
          data-animate-stagger="70"
        >
          {items.map((item) => {
            const isActive = item.slug === activeSlug;
            const isAll = item.slug === "all";
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={`category-link pressable enter-animated enter-from-left enter-duration-short${isActive ? " category-link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <CategoryIcon
                  value={item.icon}
                  className={`category-link__icon${isAll ? " category-link__icon--solo" : ""}`}
                />
                {!isAll ? item.label : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
