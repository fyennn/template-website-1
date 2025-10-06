"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/products";
import type { CategorySlug, Product } from "@/lib/products";
import type { CartOptionSelection } from "@/lib/cart";
import { useCart } from "@/lib/cartStore";

const beverageCategories: CategorySlug[] = [
  "pistachio-series",
  "matcha-club",
  "master-soe-series",
];

const isBeverageCategory = (slug: CategorySlug) =>
  beverageCategories.includes(slug);

type Option = {
  id: string;
  label: string;
  priceDelta?: number;
};

type OptionGroup = {
  id: string;
  title: string;
  icon?: string;
  type: "single" | "multiple";
  options: Option[];
  defaultOptionId?: string;
};

function buildOptionGroups(category: CategorySlug): OptionGroup[] {
  if (isBeverageCategory(category)) {
    return [
      {
        id: "size",
        title: "Ukuran",
        icon: "styler",
        type: "single",
        defaultOptionId: "regular",
        options: [
          { id: "small", label: "Small", priceDelta: -3000 },
          { id: "regular", label: "Regular" },
          { id: "large", label: "Large", priceDelta: 5000 },
        ],
      },
      {
        id: "ice",
        title: "Level Es",
        icon: "ac_unit",
        type: "single",
        defaultOptionId: "normal",
        options: [
          { id: "no-ice", label: "No Ice" },
          { id: "less-ice", label: "Less Ice" },
          { id: "normal", label: "Normal" },
          { id: "extra-ice", label: "Extra Ice" },
        ],
      },
      {
        id: "sugar",
        title: "Level Gula",
        icon: "water_drop",
        type: "single",
        defaultOptionId: "normal",
        options: [
          { id: "no-sugar", label: "No Sugar" },
          { id: "less-sugar", label: "Less Sugar" },
          { id: "normal", label: "Normal" },
          { id: "extra-sugar", label: "Extra Sugar" },
        ],
      },
      {
        id: "addons",
        title: "Tambahan",
        icon: "breakfast_dining",
        type: "multiple",
        options: [
          { id: "boba", label: "Boba", priceDelta: 8000 },
          { id: "extra-shot", label: "Extra Shot", priceDelta: 10000 },
          { id: "whipped-cream", label: "Whipped Cream", priceDelta: 5000 },
          { id: "caramel-drizzle", label: "Caramel Drizzle", priceDelta: 5000 },
        ],
      },
    ];
  }

  return [
    {
      id: "size",
      title: "Ukuran",
      icon: "straighten",
      type: "single",
      defaultOptionId: "regular",
      options: [
        { id: "small", label: "Small" },
        { id: "regular", label: "Regular" },
        { id: "large", label: "Large" },
      ],
    },
    {
      id: "addons",
      title: "Tambahan",
      icon: "style",
      type: "multiple",
      options: [
        { id: "gift-wrap", label: "Gift Wrap", priceDelta: 10000 },
        { id: "engrave", label: "Engrave", priceDelta: 15000 },
      ],
    },
  ];
}

type SelectionState = {
  singles: Record<string, string>;
  multiples: Record<string, Set<string>>;
};

function createInitialState(groups: OptionGroup[]): SelectionState {
  return {
    singles: groups
      .filter((group) => group.type === "single" && group.defaultOptionId)
      .reduce<Record<string, string>>((acc, group) => {
        acc[group.id] = group.defaultOptionId as string;
        return acc;
      }, {}),
    multiples: groups
      .filter((group) => group.type === "multiple")
      .reduce<Record<string, Set<string>>>((acc, group) => {
        acc[group.id] = new Set<string>();
        return acc;
      }, {}),
  };
}

function toggleMultiple(state: SelectionState, groupId: string, optionId: string) {
  const current = new Set(state.multiples[groupId] ?? []);
  if (current.has(optionId)) {
    current.delete(optionId);
  } else {
    current.add(optionId);
  }
  return current;
}

type ProductDetailProps = {
  product: Product;
  category: CategorySlug;
};

export function ProductDetail({ product, category }: ProductDetailProps) {
  const optionGroups = useMemo(() => buildOptionGroups(category), [category]);
  const [selection, setSelection] = useState<SelectionState>(
    createInitialState(optionGroups)
  );
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();

  const totalAddons = useMemo(() => {
    let total = 0;
    optionGroups.forEach((group) => {
      if (group.type === "single") {
        const selectedId = selection.singles[group.id];
        const selectedOption = group.options.find(
          (option) => option.id === selectedId
        );
        if (selectedOption?.priceDelta) {
          total += selectedOption.priceDelta;
        }
      } else {
        const selected = selection.multiples[group.id];
        if (selected) {
          selected.forEach((optionId) => {
            const option = group.options.find((item) => item.id === optionId);
            if (option?.priceDelta) {
              total += option.priceDelta;
            }
          });
        }
      }
    });
    return total;
  }, [optionGroups, selection]);

  const totalPrice = (product.price + totalAddons) * quantity;

  const handleAddToCart = () => {
    const options = optionGroups.flatMap((group) => {
      if (group.type === "single") {
        const selectedId = selection.singles[group.id];
        const option = group.options.find((item) => item.id === selectedId);
        if (!option) {
          return [] as CartOptionSelection[];
        }
        return [
          {
            group: group.title,
            label: option.label,
            priceDelta: option.priceDelta,
          },
        ];
      }
      const selected = selection.multiples[group.id];
      if (!selected || selected.size === 0) {
        return [] as CartOptionSelection[];
      }
      return Array.from(selected).map((optionId) => {
        const option = group.options.find((item) => item.id === optionId);
        return {
          group: group.title,
          label: option?.label ?? optionId,
          priceDelta: option?.priceDelta,
        } satisfies CartOptionSelection;
      });
    });

    addItem({
      productId: product.id,
      quantity,
      options,
    });

    router.push("/");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f9fafb] via-[#f3f6f9] to-[#f0f4f8] text-gray-800 pb-24">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <header className="flex items-center justify-between text-sm text-gray-500">
          <div>
            <p className="uppercase tracking-[0.3em] text-xs font-semibold">Detail Produk</p>
            <h1 className="text-xl font-semibold text-gray-700 mt-1">
              {product.name}
            </h1>
          </div>
          <span className="material-symbols-outlined text-gray-400">coffee</span>
        </header>

        <section className="mt-6 overflow-hidden rounded-3xl shadow-lg bg-white/60 backdrop-blur">
          <div className="relative h-64 sm:h-72 md:h-80">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 768px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 leading-relaxed">
              {product.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Harga</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-6">
          {optionGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-3xl bg-white/70 backdrop-blur shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {group.icon ? (
                    <span className="material-symbols-outlined text-[20px] text-amber-700/70">
                      {group.icon}
                    </span>
                  ) : null}
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {group.title}
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {group.options.map((option) => {
                  const isSelected =
                    group.type === "single"
                      ? selection.singles[group.id] === option.id
                      : selection.multiples[group.id]?.has(option.id);

                  const priceTag = option.priceDelta
                    ? option.priceDelta > 0
                      ? `+${formatCurrency(option.priceDelta)}`
                      : formatCurrency(option.priceDelta)
                    : undefined;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`detail-option-button ${
                        isSelected
                          ? "detail-option-button--selected"
                          : "detail-option-button--unselected"
                      }`}
                      onClick={() =>
                        setSelection((prev) => {
                          if (group.type === "single") {
                            return {
                              ...prev,
                              singles: {
                                ...prev.singles,
                                [group.id]: option.id,
                              },
                            };
                          }
                          return {
                            ...prev,
                            multiples: {
                              ...prev.multiples,
                              [group.id]: toggleMultiple(prev, group.id, option.id),
                            },
                          };
                        })
                      }
                    >
                      <span>{option.label}</span>
                      {priceTag ? (
                        <span
                          className="detail-option-button__price block text-xs font-semibold mt-1"
                        >
                          {priceTag}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="rounded-3xl bg-white/70 backdrop-blur shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Jumlah
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full border border-amber-300 text-amber-600 flex items-center justify-center text-lg"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="text-lg font-semibold text-gray-700">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="h-10 w-10 rounded-full border border-amber-300 text-amber-600 flex items-center justify-center text-lg"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Subtotal item: {formatCurrency(product.price + totalAddons)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-white/80 backdrop-blur-lg border-t border-white/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Total
            </p>
            <p className="text-xl font-semibold text-gray-800">
              {formatCurrency(totalPrice)}
            </p>
          </div>
          <button
            type="button"
            className="detail-add-button"
            onClick={handleAddToCart}
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
