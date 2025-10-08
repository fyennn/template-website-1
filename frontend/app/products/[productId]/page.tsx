import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { PRODUCT_CATEGORY_LOOKUP, getProductById } from "@/lib/products";

export function generateStaticParams() {
  const canonical = Object.keys(PRODUCT_CATEGORY_LOOKUP).map((productId) => ({
    productId,
  }));
  return canonical;
}

type ProductPageProps = {
  params: { productId: string };
};

export default function ProductPage({ params }: ProductPageProps) {
  const productId = params?.productId;

  if (!productId) {
    notFound();
  }

  const match = getProductById(productId);

  if (!match) {
    notFound();
  }

  return <ProductDetail product={match.product} category={match.category} />;
}
