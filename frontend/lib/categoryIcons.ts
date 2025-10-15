export const CATEGORIES_STORAGE_KEY = "spm-admin-categories";

export function extractCategoryIconOverrides(raw: unknown): Record<string, string> {
  const icons: Record<string, string> = {};

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (entry && typeof entry === "object") {
        const slug = typeof (entry as { slug?: unknown }).slug === "string" ? ((entry as { slug?: unknown }).slug as string) : "";
        const icon = typeof (entry as { icon?: unknown }).icon === "string" ? ((entry as { icon?: unknown }).icon as string) : "";
        if (slug && icon.trim()) {
          icons[slug] = icon;
        }
      }
    });
    return icons;
  }

  if (!raw || typeof raw !== "object") {
    return icons;
  }

  const maybeIcons = (raw as { icons?: unknown }).icons;
  if (maybeIcons && typeof maybeIcons === "object") {
    Object.entries(maybeIcons as Record<string, unknown>).forEach(([slug, icon]) => {
      if (typeof icon === "string" && icon.trim()) {
        icons[slug] = icon;
      }
    });
  } else {
    const maybeCategories = (raw as { categories?: unknown }).categories;
    if (Array.isArray(maybeCategories)) {
      maybeCategories.forEach((entry) => {
        if (entry && typeof entry === "object") {
          const slug = typeof (entry as { slug?: unknown }).slug === "string" ? ((entry as { slug?: unknown }).slug as string) : "";
          const icon = typeof (entry as { icon?: unknown }).icon === "string" ? ((entry as { icon?: unknown }).icon as string) : "";
          if (slug && icon.trim()) {
            icons[slug] = icon;
          }
        }
      });
    }
  }

  return icons;
}
