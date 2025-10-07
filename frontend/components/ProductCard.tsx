import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { formatCurrency } from "@/lib/products";
import type { Product } from "@/lib/products";

type CSSVariableStyle = CSSProperties & Record<string, string | number>;

export type ProductCardProps = {
  product: Product;
  index?: number;
  redirectTo?: string;
};

export function ProductCard({ product, index, redirectTo }: ProductCardProps) {
  const style: CSSVariableStyle | undefined =
    typeof index === "number"
      ? ({
          "--card-index": index,
        } as CSSVariableStyle)
      : undefined;

  const href = redirectTo
    ? `/products/${product.id}?redirect=${encodeURIComponent(redirectTo)}`
    : `/products/${product.id}`;

  return (
    <Link href={href} className="block focus:outline-none">
      <article className="product-card" style={style} data-product-id={product.id}>
        <div className="product-card__image">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="product-card__image-inner"
            priority={index === 0}
          />
        </div>
        <div className="product-card__body">
          <h3 className="font-bold text-sm text-gray-800">{product.name}</h3>
          <p className="product-card__description">
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
