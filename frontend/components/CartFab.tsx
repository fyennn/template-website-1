"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cartStore";
import { isCashierCardSlug, isTakeawaySlug } from "@/lib/tables";

export function CartFab() {
  const { items, tableId } = useCart();
  const pathname = usePathname();
  const isCashierContext =
    pathname?.startsWith("/cashier") ||
    isCashierCardSlug(tableId) ||
    isTakeawaySlug(tableId);
  const baseCartPath = isCashierContext ? "/cashier/cart" : "/cart";
  const cartHref = tableId
    ? `${baseCartPath}?cards=${encodeURIComponent(tableId)}`
    : baseCartPath;
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <span className="cart-hint">
        <span className="material-symbols-outlined text-[14px] text-emerald-200">
          swipe_up
        </span>
        Checkout
      </span>
      <Link
        href={cartHref}
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
