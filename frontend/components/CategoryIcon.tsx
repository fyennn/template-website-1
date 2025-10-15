/* eslint-disable @next/next/no-img-element */

export function isImageIcon(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("data:image/")) {
    return true;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/")
  ) {
    const extensionMatch = trimmed.match(/\.([a-z0-9]{2,5})(?:\?|$)/);
    if (!extensionMatch) {
      return true;
    }
    const extension = extensionMatch[1];
    return ["svg", "png", "jpg", "jpeg", "webp", "gif", "avif"].includes(extension);
  }

  return false;
}

export type CategoryIconProps = {
  value?: string | null;
  fallback?: string;
  className?: string;
  alt?: string;
};

export function CategoryIcon({ value, fallback = "category", className, alt }: CategoryIconProps) {
  const iconValue = (value ?? "").trim();

  if (iconValue && isImageIcon(iconValue)) {
    const imageClasses = ["inline-block h-5 w-5 object-contain", className].filter(Boolean).join(" ");
    return <img src={iconValue} alt={alt ?? ""} className={imageClasses} aria-hidden={alt ? undefined : true} />;
  }

  const materialClasses = ["material-symbols-outlined", className].filter(Boolean).join(" ");
  return (
    <span className={materialClasses} aria-hidden>
      {iconValue || fallback}
    </span>
  );
}
