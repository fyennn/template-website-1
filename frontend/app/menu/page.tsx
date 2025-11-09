import { MenuPageContent } from "@/components/MenuPage";
import { NAVIGATION } from "@/lib/navigation";

export default function MenuPage() {
  const navigation = NAVIGATION;
  return <MenuPageContent navigation={navigation} />;
}
