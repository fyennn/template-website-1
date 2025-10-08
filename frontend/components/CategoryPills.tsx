import Link from "next/link";
import type { MouseEvent } from "react";
import type { NavigationItem } from "@/lib/navigation";
import type { CategorySlug } from "@/lib/products";

export type CategoryPillsProps = {
  items: NavigationItem[];
  activeSlug: string;
  onSelect?: (slug: CategorySlug, event: MouseEvent<HTMLAnchorElement>) => void;
};

export function CategoryPills({ items, activeSlug, onSelect }: CategoryPillsProps) {
  return (
    <nav
      className="md:hidden px-4 py-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap"
      data-animate-group="category-mobile"
      data-animate-stagger="60"
    >
      {items.map((item) => {
        const isActive = item.slug === activeSlug;
        const isAll = item.slug === "all";
        return (
          <Link
            key={item.slug}
            href={item.href}
            scroll={onSelect ? false : undefined}
            className={`category-pill pill-pressable enter-animated enter-from-bottom enter-duration-short${isActive ? " category-pill--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
            onClick={(event) => {
              if (onSelect) {
                event.preventDefault();
                onSelect(item.slug, event);
              }
            }}
          >
            <span
              className={`material-symbols-outlined category-pill__icon${isAll ? " category-pill__icon--solo" : ""}`}
            >
              {item.icon}
            </span>
            {!isAll ? item.pillLabel ?? item.label : null}
          </Link>
        );
      })}
    </nav>
  );
}
