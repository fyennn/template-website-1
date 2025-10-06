import { getProductById, formatCurrency } from "@/lib/products";

export type CartOptionSelection = {
  group: string;
  label: string;
  priceDelta?: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
  options: CartOptionSelection[];
  notes?: string;
};

export const SAMPLE_CART: CartItem[] = [
  {
    productId: "pistachio-latte",
    quantity: 2,
    options: [
      { group: "Ukuran", label: "Regular" },
      { group: "Level Es", label: "Less Ice" },
      { group: "Level Gula", label: "Normal" },
      { group: "Tambahan", label: "Boba", priceDelta: 8000 },
    ],
  },
  {
    productId: "matcha-frappe",
    quantity: 1,
    options: [
      { group: "Ukuran", label: "Large", priceDelta: 5000 },
      { group: "Level Es", label: "Extra Ice" },
      { group: "Level Gula", label: "Less Sugar" },
      { group: "Tambahan", label: "Whipped Cream", priceDelta: 5000 },
    ],
  },
];

export type DerivedCartLine = {
  cartIndex: number;
  product: NonNullable<ReturnType<typeof getProductById>>["product"];
  category: NonNullable<ReturnType<typeof getProductById>>["category"];
  unitPrice: number;
  unitPriceLabel: string;
  lineTotal: number;
  lineTotalLabel: string;
  addOnTotal: number;
} & CartItem;

export function deriveCartLines(cartItems: CartItem[]): DerivedCartLine[] {
  return cartItems
    .map((item, index) => {
      const data = getProductById(item.productId);
      if (!data) {
        return null;
      }

      const addOnTotal = item.options.reduce((total, option) => {
        return total + (option.priceDelta ?? 0);
      }, 0);
      const unitPrice = data.product.price + addOnTotal;
      const lineTotal = unitPrice * item.quantity;

      return {
        ...item,
        cartIndex: index,
        product: data.product,
        category: data.category,
        addOnTotal,
        unitPrice,
        unitPriceLabel: formatCurrency(unitPrice),
        lineTotal,
        lineTotalLabel: formatCurrency(lineTotal),
      } satisfies DerivedCartLine;
    })
    .filter(Boolean) as DerivedCartLine[];
}

export type CartSummary = {
  subtotal: number;
  tax: number;
  total: number;
  subtotalLabel: string;
  taxLabel: string;
  totalLabel: string;
};

export function computeCartSummary(cartItems: DerivedCartLine[]): CartSummary {
  const subtotal = cartItems.reduce((total, item) => total + item.lineTotal, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    subtotalLabel: formatCurrency(subtotal),
    taxLabel: formatCurrency(tax),
    totalLabel: formatCurrency(total),
  };
}
