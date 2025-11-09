export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type ProductCatalog = Record<string, Product[]>;
export type CategorySlug = string;

export type CustomizationOption = {
  id: string;
  label: string;
  priceAdjustment: number;
};

export type CustomizationGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  helperText?: string;
  options: CustomizationOption[];
};

export type AdminProductRecord = {
  id: string;
  name: string;
  category: CategorySlug;
  price: number;
  description: string;
  sku: string;
  imageUrl: string;
  highlight: string;
  isAvailable: boolean;
  isFeatured: boolean;
  soldOut: boolean;
  hotOption: boolean;
  icedOption: boolean;
  prepTime: string;
  calories: string;
  createdAt: string;
  customizations: CustomizationGroup[];
};

export const PRODUCTS_STORAGE_KEY = "spm-admin-products";
export const PRODUCTS_EVENT = "spm:products-updated";

const PRODUCT_PLACEHOLDER_IMAGE = "/images/product-placeholder.svg";

const DEFAULT_PRODUCT_SOURCE: Record<CategorySlug, Product[]> = {
  "pistachio-series": [
    {
      id: "pistachio-latte",
      name: "Pistachio Latte",
      description: "Creamy pistachio flavor with espresso",
      price: 55000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "pistachio-frappe",
      name: "Pistachio Frappe",
      description: "Blended pistachio and coffee delight",
      price: 60000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "iced-pistachio-coffee",
      name: "Iced Pistachio Coffee",
      description: "Refreshing iced coffee with pistachio",
      price: 57500,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "pistachio-choco",
      name: "Pistachio Choco",
      description: "Warm chocolate with a hint of pistachio",
      price: 52500,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
  ],
  "matcha-club": [
    {
      id: "matcha-latte",
      name: "Matcha Latte",
      description: "Creamy matcha flavor with milk",
      price: 50000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "matcha-frappe",
      name: "Matcha Frappe",
      description: "Blended matcha delight",
      price: 55000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "iced-matcha",
      name: "Iced Matcha",
      description: "Refreshing iced matcha",
      price: 52500,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "matcha-cake",
      name: "Matcha Cake",
      description: "Delicious matcha flavored cake",
      price: 45000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
  ],
  "master-soe-series": [
    {
      id: "ethiopia-yirgacheffe",
      name: "Ethiopia Yirgacheffe",
      description: "Fruity and floral notes",
      price: 150000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "colombia-supremo",
      name: "Colombia Supremo",
      description: "Rich and nutty flavor",
      price: 120000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "kenya-aa",
      name: "Kenya AA",
      description: "Bright and acidic with berry notes",
      price: 135000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "brazil-santos",
      name: "Brazil Santos",
      description: "Smooth and mild with a nutty flavor",
      price: 110000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
  ],
  merchandise: [
    {
      id: "spm-cafe-t-shirt",
      name: "AIVRA T-Shirt",
      description: "High quality cotton t-shirt",
      price: 250000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "spm-cafe-mug",
      name: "AIVRA Mug",
      description: "Ceramic mug with AIVRA logo",
      price: 150000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "spm-cafe-tote-bag",
      name: "AIVRA Tote Bag",
      description: "Canvas tote bag with AIVRA logo",
      price: 200000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
    {
      id: "spm-cafe-cap",
      name: "AIVRA Cap",
      description: "Cotton cap with AIVRA logo",
      price: 180000,
      image: PRODUCT_PLACEHOLDER_IMAGE,
    },
  ],
};

const LEGACY_PRODUCT_ID_MAP: Record<string, string> = {
  "sample-pistachio-latte": "pistachio-latte",
  "sample-matcha-frappe": "matcha-frappe",
  "sample-ethiopia-yirgacheffe": "ethiopia-yirgacheffe",
};

const DEFAULT_ADMIN_PRODUCTS_INTERNAL: AdminProductRecord[] = Object.entries(
  DEFAULT_PRODUCT_SOURCE
).flatMap(([category, products]) => {
  const isMerchandise = category === "merchandise";
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: category as CategorySlug,
    price: product.price,
    description: product.description,
    sku: product.id.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
    imageUrl: product.image,
    highlight: "",
    isAvailable: true,
    isFeatured: false,
    soldOut: false,
    hotOption: !isMerchandise,
    icedOption: !isMerchandise,
    prepTime: "",
    calories: "0",
    createdAt: new Date().toISOString(),
    customizations: [],
  }));
});

const DEFAULT_PRODUCT_IMAGE_MAP: Record<string, string> = DEFAULT_ADMIN_PRODUCTS_INTERNAL.reduce(
  (acc, product) => {
    acc[product.id] = product.imageUrl;
    return acc;
  },
  {} as Record<string, string>
);

export const DEFAULT_ADMIN_PRODUCTS: AdminProductRecord[] =
  DEFAULT_ADMIN_PRODUCTS_INTERNAL.map((product) => ({
    ...product,
    customizations: product.customizations.map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option })),
    })),
  }));

type BuildCatalogResult = {
  catalog: ProductCatalog;
  allProductsWithCategory: Array<{ product: Product; category: CategorySlug }>;
  lookup: Record<string, CategorySlug>;
};

function createProductFromAdmin(record: AdminProductRecord): Product {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    price: record.price,
    image: record.imageUrl,
  };
}

function normalizeAdminProduct(record: AdminProductRecord): AdminProductRecord {
  const normalizedId = LEGACY_PRODUCT_ID_MAP[record.id] ?? record.id;
  const rawImageUrl = (record.imageUrl ?? "").trim();
  const needsFallback =
    !rawImageUrl || rawImageUrl.includes("googleusercontent.com/aida-public");
  const fallbackImage =
    DEFAULT_PRODUCT_IMAGE_MAP[normalizedId] ?? "/images/product-placeholder.svg";
  const normalizedImageUrl = needsFallback ? fallbackImage : rawImageUrl;
  return {
    ...record,
    id: normalizedId,
    imageUrl: normalizedImageUrl,
    customizations: Array.isArray(record.customizations)
      ? record.customizations.map((group) => ({
          ...group,
          options: Array.isArray(group.options)
            ? group.options.map((option) => ({ ...option }))
            : [],
        }))
      : [],
  };
}

export function buildProductCatalog(
  adminProducts: AdminProductRecord[]
): BuildCatalogResult {
  const catalog: ProductCatalog = { all: [] };
  const lookup: Record<string, CategorySlug> = {};
  const allProductsWithCategory: Array<{ product: Product; category: CategorySlug }> = [];

  adminProducts.forEach((record) => {
    const category = (record.category || "uncategorized") as CategorySlug;
    const normalizedId = LEGACY_PRODUCT_ID_MAP[record.id] ?? record.id;
    const product = createProductFromAdmin({ ...record, id: normalizedId });

    if (!catalog[category]) {
      catalog[category] = [];
    }
    catalog[category].push(product);
    lookup[product.id] = category;
    allProductsWithCategory.push({ product, category });
  });

  const aggregated = new Map<string, Product>();
  Object.entries(catalog).forEach(([slug, products]) => {
    if (slug === "all") {
      return;
    }
    products.forEach((product) => {
      if (!aggregated.has(product.id)) {
        aggregated.set(product.id, product);
      }
    });
  });
  catalog.all = Array.from(aggregated.values());

  return { catalog, allProductsWithCategory, lookup };
}

function safeParseAdminProducts(raw: string | null): AdminProductRecord[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as AdminProductRecord[];
  } catch (error) {
    console.error("Failed to parse stored admin products", error);
    return null;
  }
}

export function loadAdminProductsFromStorage(): AdminProductRecord[] {
  if (typeof window === "undefined") {
    return DEFAULT_ADMIN_PRODUCTS.map((product) => ({ ...product }));
  }
  const stored = safeParseAdminProducts(
    window.localStorage.getItem(PRODUCTS_STORAGE_KEY)
  );
  if (!stored || stored.length === 0) {
    return DEFAULT_ADMIN_PRODUCTS.map((product) => ({ ...product }));
  }
  return stored.map((product) => normalizeAdminProduct(product));
}

export function saveAdminProductsToStorage(products: AdminProductRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event(PRODUCTS_EVENT));
  } catch (error) {
    console.error("Failed to persist admin products", error);
  }
}

const defaultCatalog = buildProductCatalog(DEFAULT_ADMIN_PRODUCTS);

export const PRODUCT_CATALOG = defaultCatalog.catalog;
export const ALL_PRODUCTS_WITH_CATEGORY = defaultCatalog.allProductsWithCategory;
export const PRODUCT_CATEGORY_LOOKUP = defaultCatalog.lookup;

export function createCatalogFromAdminProducts(adminProducts: AdminProductRecord[]) {
  return buildProductCatalog(adminProducts);
}

function findProductInCatalog(
  catalog: ProductCatalog,
  lookup: Record<string, CategorySlug>,
  productId: string
) {
  const category = lookup[productId];
  if (!category) {
    return null;
  }
  const product = catalog[category]?.find((item) => item.id === productId) ?? null;
  return product ? { product, category } : null;
}

export function getProductById(productId: string) {
  const normalizedId = LEGACY_PRODUCT_ID_MAP[productId] ?? productId;
  if (typeof window !== "undefined") {
    const adminProducts = loadAdminProductsFromStorage();
    const { catalog, lookup } = buildProductCatalog(adminProducts);
    const match = findProductInCatalog(catalog, lookup, normalizedId);
    if (match) {
      return match;
    }
  }
  return findProductInCatalog(PRODUCT_CATALOG, PRODUCT_CATEGORY_LOOKUP, normalizedId);
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace("Rp", "Rp ");
}
