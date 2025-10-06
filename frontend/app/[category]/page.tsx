import { redirect, notFound } from "next/navigation";
import { CategoryPage } from "@/components/CategoryPage";
import {
  CATEGORY_ALIASES,
  DEFAULT_CATEGORY,
  NAVIGATION,
  categoryToPath,
} from "@/lib/navigation";
import type { CategorySlug } from "@/lib/products";

const CANONICAL_SLUGS = new Set<CategorySlug>(
  NAVIGATION.map((item) => item.slug)
);

function resolveCategorySlug(segment: string): CategorySlug | null {
  if (CANONICAL_SLUGS.has(segment as CategorySlug)) {
    return segment as CategorySlug;
  }
  const alias = CATEGORY_ALIASES[segment];
  return alias ?? null;
}

export function generateStaticParams() {
  const canonicalParams = NAVIGATION.map((item) => ({ category: item.slug }));
  const aliasParams = Object.keys(CATEGORY_ALIASES).map((alias) => ({
    category: alias,
  }));
  return [...canonicalParams, ...aliasParams];
}

export default function CategoryRoute({
  params,
}: {
  params: { category: string };
}) {
  const resolved = resolveCategorySlug(params.category);

  if (!resolved) {
    notFound();
  }

  const aliasTarget = CATEGORY_ALIASES[params.category];
  if (aliasTarget) {
    redirect(categoryToPath(aliasTarget));
  }

  if (resolved === DEFAULT_CATEGORY) {
    redirect(categoryToPath(DEFAULT_CATEGORY));
  }

  return <CategoryPage categorySlug={resolved} />;
}
