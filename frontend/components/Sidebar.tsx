import Image from "next/image";
import Link from "next/link";
import type { NavigationItem } from "@/lib/navigation";

export type SidebarProps = {
  items: NavigationItem[];
  activeSlug: string;
};

export function Sidebar({ items, activeSlug }: SidebarProps) {
  return (
    <aside className="hidden md:block w-64 bg-white shadow-sm min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsiHIdLAZymKywmghuMJ4DnMud2B6E1CzythChBRnHHYVHHbyl717uDSqWpl530JlSId2MxEhHz78ptp-CAGshOvKKeU9yud3F4M4aQ6eGYrrGAfZBnIse5F98soktjbyVpPmo_QeNCMUndjKVj8Tc4qNpY6Fd3XEJkiMJCiMi9BbOHNbuJvjmD_ePxe-FZuGXvShGRktUkdCK47mqzUCgo_fSHO3Kfbnef25GdcamaiYNuBKN1iyAT8Nv7P_0pTtXbuLOcKV1ObM"
          alt="SPM Café Logo"
          className="h-10 w-auto enter-animated enter-from-left enter-duration-short"
          data-animate-delay="40"
          width={160}
          height={40}
          priority
        />
      </div>
      <nav
        className="py-6"
        data-animate-group="category-desktop"
        data-animate-stagger="70"
      >
        {items.map((item) => {
          const isActive = item.slug === activeSlug;
          return (
            <Link
              key={item.slug}
              href={item.href}
              className={`category-link pressable enter-animated enter-from-left enter-duration-short${isActive ? " category-link--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="material-symbols-outlined category-link__icon">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
