import { CategoryPage } from "@/components/CategoryPage";
import { DEFAULT_CATEGORY } from "@/lib/navigation";

export default function HomePage() {
  return <CategoryPage categorySlug={DEFAULT_CATEGORY} />;
}
