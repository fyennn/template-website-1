import Link from "next/link";
import type { CSSProperties } from "react";
import { formatCurrency } from "@/lib/products";
import type { Product } from "@/lib/products";

type CSSVariableStyle = CSSProperties & Record<string, string | number>;

export type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index }: ProductCardProps) {
  const style: CSSVariableStyle | undefined =
    typeof index === "number"
      ? ({
          "--card-index": index,
        } as CSSVariableStyle)
      : undefined;

  return (
    <Link href={`/products/${product.id}`} className="block focus:outline-none">
      <article className="product-card" style={style} data-product-id={product.id}>
        <div
          className="product-card__image"
          style={{ backgroundImage: `url("${product.image}")` }}
        />
        <div className="product-card__body">
          <h3 className="font-bold text-sm text-gray-800">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3 flex-grow">
            {product.description}
          </p>
          <div className="flex justify-between items-center">
            <p className="font-bold text-sm text-gray-800">
              {formatCurrency(product.price)}
            </p>
            <span className="product-card__button" aria-hidden>
              <span className="material-symbols-outlined text-lg">add</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
