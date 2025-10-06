"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/lib/cartStore";

export function CartFab() {
  const { items } = useCart();
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <Link
        href="/cart"
        className="shop-fab enter-animated enter-pop enter-duration-long"
        data-animate-delay="320"
        aria-label="Buka keranjang"
      >
        <span className="material-symbols-outlined">shopping_bag</span>
        <span className="absolute -top-1 -right-1 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {count}
        </span>
      </Link>
    </div>
  );
}
