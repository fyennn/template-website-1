import { MenuPageContent } from "@/components/MenuPage";
import { NAVIGATION } from "@/lib/navigation";
import { PRODUCT_CATALOG } from "@/lib/products";

export default function MenuPage() {
  const navigation = NAVIGATION;
  const sections = navigation
    .filter((item) => item.slug !== "all")
    .map((item) => ({
      slug: item.slug,
      label: item.label,
      products: PRODUCT_CATALOG[item.slug] ?? [],
    }));

  return <MenuPageContent navigation={navigation} sections={sections} />;
}
