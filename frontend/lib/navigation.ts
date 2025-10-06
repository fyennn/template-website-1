import type { CategorySlug } from "@/lib/products";

export type NavigationItem = {
  slug: CategorySlug;
  label: string;
  pillLabel?: string;
  icon: string;
  href: string;
};

export const DEFAULT_CATEGORY: CategorySlug = "pistachio-series";

export function categoryToPath(slug: CategorySlug): string {
  return slug === DEFAULT_CATEGORY ? "/" : `/${slug}`;
}

export const CATEGORY_ALIASES: Record<string, CategorySlug> = {
  matcha: "matcha-club",
  "master-soe": "master-soe-series",
  merch: "merchandise",
};

export const NAVIGATION: NavigationItem[] = [
  {
    slug: "pistachio-series",
    label: "Pistachio Series",
    icon: "coffee",
    href: categoryToPath("pistachio-series"),
  },
  {
    slug: "matcha-club",
    label: "Matcha Club",
    icon: "eco",
    href: categoryToPath("matcha-club"),
  },
  {
    slug: "master-soe-series",
    label: "Master S.O.E Series",
    pillLabel: "Master S.O.E",
    icon: "local_cafe",
    href: categoryToPath("master-soe-series"),
  },
  {
    slug: "merchandise",
    label: "Merchandise",
    icon: "redeem",
    href: categoryToPath("merchandise"),
  },
];
