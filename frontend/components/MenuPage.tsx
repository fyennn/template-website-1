"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { NavigationItem } from "@/lib/navigation";
import type { CategorySlug, Product } from "@/lib/products";
import { setupMotionEffects } from "@/lib/motion";
import { Header } from "@/components/Header";
import { CategoryPills } from "@/components/CategoryPills";
import { CartFab } from "@/components/CartFab";
import { ProductCard } from "@/components/ProductCard";

type MenuSection = {
  slug: CategorySlug;
  label: string;
  products: Product[];
};

export type MenuPageProps = {
  navigation: NavigationItem[];
  sections: MenuSection[];
};

const gridClassName =
  "p-4 pb-24 space-y-12 md:space-y-16";

export function MenuPageContent({ navigation, sections }: MenuPageProps) {
  const defaultSlug = navigation[0]?.slug ?? "all";
  const [activeSlug, setActiveSlug] = useState<CategorySlug>(defaultSlug);
  const allSentinelRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const activeSlugRef = useRef(activeSlug);
  const intersectionMapRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    activeSlugRef.current = activeSlug;
  }, [activeSlug]);

  useEffect(() => {
    const cleanup = setupMotionEffects();
    return () => cleanup();
  }, []);

  const updateActiveSlug = useCallback((slug: CategorySlug) => {
    if (activeSlugRef.current !== slug) {
      setActiveSlug(slug);
    }
  }, []);

  const handleNavigation = useCallback(
    (slug: CategorySlug) => {
      updateActiveSlug(slug);
      const target =
        slug === "all" ? allSentinelRef.current : sectionRefs.current[slug];
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: slug === "all" ? "start" : "start",
        });
      }

      if (typeof window !== "undefined") {
        const basePath = window.location.pathname;
        const nextUrl = slug === "all" ? basePath : `${basePath}#${slug}`;
        if (window.location.hash !== (slug === "all" ? "" : `#${slug}`)) {
          window.history.replaceState(null, "", nextUrl);
        }
      }
    },
    [updateActiveSlug]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) {
        updateActiveSlug("all");
        return;
      }

      const slug = hash as CategorySlug;
      if (sectionRefs.current[slug] || slug === "all") {
        updateActiveSlug(slug);
        const target =
          slug === "all" ? allSentinelRef.current : sectionRefs.current[slug];
        if (target) {
          target.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [updateActiveSlug]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intersectionState = intersectionMapRef.current;

    const evaluateActiveFromIntersections = () => {
      if (intersectionState.size === 0) {
        return;
      }

      const viewportAnchor =
        typeof window !== "undefined"
          ? Math.min(window.innerHeight * 0.28, 240)
          : 180;

      let bestSlug: CategorySlug | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      intersectionState.forEach((entry, slug) => {
        const distance = Math.abs(entry.boundingClientRect.top - viewportAnchor);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSlug = slug as CategorySlug;
        }
      });

      if (bestSlug) {
        updateActiveSlug(bestSlug);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const { slug } = (entry.target as HTMLElement).dataset;
          if (!slug) {
            return;
          }

          if (entry.isIntersecting) {
            intersectionState.set(slug, entry);
          } else {
            intersectionState.delete(slug);
          }
        });

        evaluateActiveFromIntersections();
      },
      {
        rootMargin: "-12% 0px -65% 0px",
        threshold: [0, 0.05, 0.15, 0.35, 0.55, 0.75],
      }
    );

    const observedElements: HTMLElement[] = [];

    if (allSentinelRef.current) {
      observer.observe(allSentinelRef.current);
      observedElements.push(allSentinelRef.current);
    }

    sections.forEach((section) => {
      const element = sectionRefs.current[section.slug];
      if (element) {
        observer.observe(element);
        observedElements.push(element);
      }
    });

    return () => {
      observedElements.forEach((element) => observer.unobserve(element));
      observer.disconnect();
      intersectionState.clear();
    };
  }, [sections, updateActiveSlug]);

  const sectionsWithProducts = useMemo(
    () =>
      sections.filter((section) => (section.products?.length ?? 0) > 0),
    [sections]
  );

  return (
    <div className="max-w-7xl mx-auto md:flex md:items-start md:min-h-screen">
      <aside
        className="hidden md:flex w-64 bg-gradient-to-br from-[#ecf8f4] via-white to-[#f3fbf7] shadow-sm border-r border-emerald-50/70 md:sticky md:top-0 md:h-screen"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex h-full w-full flex-col">
          <div className="px-6 pb-4 pt-6 border-b border-emerald-100/60 bg-white/80 backdrop-blur">
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
            className="flex-1 overflow-y-auto py-6 px-2 flex flex-col gap-1"
            data-animate-group="category-desktop"
            data-animate-stagger="70"
          >
            {navigation.map((item) => {
              const isActive = item.slug === activeSlug;
              const isAll = item.slug === "all";
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => handleNavigation(item.slug)}
                  className={`text-left category-link pressable enter-animated enter-from-left enter-duration-short${isActive ? " category-link--active" : ""}`}
                  aria-pressed={isActive}
                  aria-label={item.label}
                >
                  <span
                    className={`material-symbols-outlined category-link__icon${isAll ? " category-link__icon--solo" : ""}`}
                  >
                    {item.icon}
                  </span>
                  {!isAll ? item.label : null}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div
          className="sticky top-0 z-30 bg-white"
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <Header />
          <CategoryPills
            items={navigation}
            activeSlug={activeSlug}
            onSelect={(slug, event) => {
              event.preventDefault();
              handleNavigation(slug);
            }}
          />
        </div>

        <div
          id="all"
          ref={allSentinelRef}
          data-slug="all"
          className="block h-1 scroll-mt-28"
        />

        <main className={gridClassName}>
          {sectionsWithProducts.map((section, sectionIndex) => (
            <section
              key={section.slug}
              id={section.slug}
              data-slug={section.slug}
              ref={(node) => {
                sectionRefs.current[section.slug] = node;
              }}
              className="space-y-4 scroll-mt-28"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700 enter-animated enter-from-left enter-duration-short">
                  {section.label}
                </h2>
              </div>
              <div
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                data-animate-grid
              >
                {section.products.map((product, productIndex) => (
                  <ProductCard
                    key={`${section.slug}-${product.id}`}
                    product={product}
                    index={sectionIndex * 100 + productIndex}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>

        <CartFab />
      </div>
    </div>
  );
}
