export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type ProductCatalog = Record<string, Product[]>;

export const PRODUCT_CATALOG = {
  "pistachio-series": [
    {
      id: "pistachio-latte",
      name: "Pistachio Latte",
      description: "Creamy pistachio flavor with espresso",
      price: 55000,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ6c9w2xX2kDiuabOBwANz7uF-RlHvb5-M45NrSbvbnLTN0ftsnUf9HjJjqVLAMgwSw17xI3Sn_IZjdUflf7rw0sirs6pcbq5URj0mrYxoQ0vNq0id-53cCFRtlLzkt2CTGyG76CiADHW5eyOmhGQEhylw2Qr_VvQX_VE1XtDjNtUVz3-bzG4UJ8pzBjGFuQdmgfl30oK1TbN4_4Y5W-6-5Qp7cp5gxpA-GgvnakgO3Jdlr1a0slJMrdPqZXsomuhiHkaRET7IJqM",
    },
    {
      id: "pistachio-frappe",
      name: "Pistachio Frappe",
      description: "Blended pistachio and coffee delight",
      price: 60000,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCPRuJyjjcBRIY5WEStZ6ZLv7a4XG72wgVWJFSksPWGdCc7S5qGLDZjkbHRI7ul3YeKuY5KLlMYu_p4y4y08wgRNT_hQirWfOOAxiGM9UhxRKdwSGACRANopzsIfI__Hy42w-PYanLfHnj4VJMLC3WbxpTMJdmT8IajLPd5iXn93r6LBfcxCOz4p7ipBMg9l04H8grlcsUuHqGqWImotG6v6Qjoa38vOVx5K8leF7N24mF3siIpOxK61xZtv596_zzkt7GsLWls-bM",
    },
    {
      id: "iced-pistachio-coffee",
      name: "Iced Pistachio Coffee",
      description: "Refreshing iced coffee with pistachio",
      price: 57500,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCUc7dT-hPrNfOwZDAv7et5bCtW2s5nFhhNIen1Ob6w3c2T_Q6G1N4QI1h8TrpTyWJcQ33cWQAZjrqU2Ky3dEaaBvDfV_dJVVjxjS8nfn-I3bzziGpM0bSuJM9DvF8Nbg8WGFrqfI4re71JxCxEm_saQiLI_uYemtmiCgc-8aO9fpITVfDKBq8aL6to_Em4rFntc6Ddap3DUG_PDIGsjEMM7zEBr6AlRddiEYOkiPQVPYC73B6AOfwtQmxW2lKClXOwKafIIZovubk",
    },
    {
      id: "pistachio-choco",
      name: "Pistachio Choco",
      description: "Warm chocolate with a hint of pistachio",
      price: 52500,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCIwMyv49ZlT01bzwdjTky3VlxorIf82IhK7JuHHFxA9L1G_smbVi9kwFMq_GAgUEUjS3B6HkZRbkkFNHhnINSu3ZLv_39ctY8_DKvEaAF4tw7ikqZEL3HxzdvANei31pbUwdixBUYR6nORdsnvXiFXTtnMQqoi-vEFKkCrk2nGCxebnfZPiUdzvvnWjHDtJBrIxmXtV8r1hT_qUYo8lyWOrT21PSk-na5svcOrj7QUIRFzc_goNX0BE13PumRaXP3nJDjZ3vKhNf8",
    },
  ],
  "matcha-club": [
    {
      id: "matcha-latte",
      name: "Matcha Latte",
      description: "Creamy matcha flavor with milk",
      price: 50000,
      image: "/images/products/matcha-latte.jpg",
    },
    {
      id: "matcha-frappe",
      name: "Matcha Frappe",
      description: "Blended matcha delight",
      price: 55000,
      image: "/images/products/matcha-frappe.jpg",
    },
    {
      id: "iced-matcha",
      name: "Iced Matcha",
      description: "Refreshing iced matcha",
      price: 52500,
      image: "/images/products/iced-matcha.jpg",
    },
    {
      id: "matcha-cake",
      name: "Matcha Cake",
      description: "Delicious matcha flavored cake",
      price: 45000,
      image: "/images/products/matcha-cake.jpg",
    },
  ],
  "master-soe-series": [
    {
      id: "ethiopia-yirgacheffe",
      name: "Ethiopia Yirgacheffe",
      description: "Fruity and floral notes",
      price: 150000,
      image: "/images/products/ethiopia-yirgacheffe.jpg",
    },
    {
      id: "colombia-supremo",
      name: "Colombia Supremo",
      description: "Rich and nutty flavor",
      price: 120000,
      image: "/images/products/colombia-supremo.jpg",
    },
    {
      id: "kenya-aa",
      name: "Kenya AA",
      description: "Bright and acidic with berry notes",
      price: 135000,
      image: "/images/products/kenya-aa.jpg",
    },
    {
      id: "brazil-santos",
      name: "Brazil Santos",
      description: "Smooth and mild with a nutty flavor",
      price: 110000,
      image: "/images/products/brazil-santos.jpg",
    },
  ],
  merchandise: [
    {
      id: "spm-cafe-t-shirt",
      name: "SPM Café T-Shirt",
      description: "High quality cotton t-shirt",
      price: 250000,
      image: "/images/products/spm-cafe-t-shirt.jpg",
    },
    {
      id: "spm-cafe-mug",
      name: "SPM Café Mug",
      description: "Ceramic mug with SPM Café logo",
      price: 150000,
      image: "/images/products/spm-cafe-mug.jpg",
    },
    {
      id: "spm-cafe-tote-bag",
      name: "SPM Café Tote Bag",
      description: "Canvas tote bag with SPM Café logo",
      price: 200000,
      image: "/images/products/spm-cafe-tote-bag.jpg",
    },
    {
      id: "spm-cafe-cap",
      name: "SPM Café Cap",
      description: "Cotton cap with SPM Café logo",
      price: 180000,
      image: "/images/products/spm-cafe-cap.jpg",
    },
  ],
} satisfies ProductCatalog;

export type CategorySlug = keyof typeof PRODUCT_CATALOG;

export const PRODUCT_CATEGORY_LOOKUP = Object.fromEntries(
  Object.entries(PRODUCT_CATALOG).flatMap(([category, products]) =>
    products.map((product) => [product.id, category])
  )
) as Record<string, CategorySlug>;

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace("Rp", "Rp ");
}

export function getProductById(productId: string) {
  const category = PRODUCT_CATEGORY_LOOKUP[productId];
  if (!category) {
    return null;
  }
  const product = PRODUCT_CATALOG[category].find((item) => item.id === productId) ?? null;
  return product ? { product, category } : null;
}
