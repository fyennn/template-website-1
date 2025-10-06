import Link from "next/link";
import type { NavigationItem } from "@/lib/navigation";

export type CategoryPillsProps = {
  items: NavigationItem[];
  activeSlug: string;
};

export function CategoryPills({ items, activeSlug }: CategoryPillsProps) {
  return (
    <nav
      className="md:hidden sticky top-[68px] z-10 bg-white px-4 py-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap"
      data-animate-group="category-mobile"
      data-animate-stagger="60"
    >
      {items.map((item) => {
        const isActive = item.slug === activeSlug;
        return (
          <Link
            key={item.slug}
            href={item.href}
            className={`category-pill pill-pressable enter-animated enter-from-bottom enter-duration-short${isActive ? " category-pill--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="material-symbols-outlined category-pill__icon">
              {item.icon}
            </span>
            {item.pillLabel ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
}
