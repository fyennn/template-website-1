"use client";

import { useOrders } from "@/lib/orderStore";

export function SampleDataButton() {
  const { addOrder } = useOrders();

  const addSampleData = () => {
    const sampleOrders = [
      {
        id: `ORD-${Date.now()}-1`,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 menit lalu
        updatedAt: new Date().toISOString(),
        tableId: "M-01",
        customerInfo: {
          name: "Budi Santoso",
          phone: "0812-3456-7890",
          email: "budi.santoso@email.com",
          notes: "Alergi kacang, mohon diperhatikan"
        },
        subtotal: 73000,
        subtotalLabel: "Rp 73.000",
        tax: 7300,
        taxLabel: "Rp 7.300",
        total: 80300,
        totalLabel: "Rp 80.300",
        status: "preparing" as const,
        paymentMethod: "qris" as const,
        paymentStatus: "paid" as const,
        estimatedTime: 15,
        notes: "Extra hot untuk latte",
        items: [
          {
            name: "Pistachio Latte",
            quantity: 2,
            unitPrice: 25000,
            unitPriceLabel: "Rp 25.000",
            linePriceLabel: "Rp 58.000",
            category: "Pistachio Series",
            image: "/images/pistachio-latte.jpg",
            options: ["Large (+Rp 5.000)", "Extra Hot", "Oat Milk (+Rp 4.000)"]
          },
          {
            name: "Matcha Cake",
            quantity: 1,
            unitPrice: 15000,
            unitPriceLabel: "Rp 15.000",
            linePriceLabel: "Rp 15.000",
            category: "Matcha Club",
            image: "/images/matcha-cake.jpg",
            options: ["Tanpa gula tambahan"]
          }
        ]
      },
      {
        id: `ORD-${Date.now()}-2`,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 menit lalu
        updatedAt: new Date().toISOString(),
        tableId: "M-05",
        customerInfo: {
          name: "Sari Dewi",
          phone: "0856-7890-1234",
          email: "",
          notes: ""
        },
        subtotal: 72000,
        subtotalLabel: "Rp 72.000",
        tax: 7200,
        taxLabel: "Rp 7.200",
        total: 79200,
        totalLabel: "Rp 79.200",
        status: "pending" as const,
        paymentMethod: "qris" as const,
        paymentStatus: "paid" as const,
        estimatedTime: 12,
        notes: "",
        items: [
          {
            name: "Iced Pistachio Coffee",
            quantity: 1,
            unitPrice: 28000,
            unitPriceLabel: "Rp 28.000",
            linePriceLabel: "Rp 28.000",
            category: "Pistachio Series",
            image: "/images/iced-pistachio.jpg",
            options: ["Regular Size", "Normal Ice", "Less Sugar"]
          },
          {
            name: "Matcha Latte",
            quantity: 2,
            unitPrice: 22000,
            unitPriceLabel: "Rp 22.000",
            linePriceLabel: "Rp 44.000",
            category: "Matcha Club",
            image: "/images/matcha-latte.jpg",
            options: ["Hot", "Extra Foam"]
          }
        ]
      },
      {
        id: `ORD-${Date.now()}-3`,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 menit lalu
        updatedAt: new Date().toISOString(),
        tableId: null, // Take away
        customerInfo: {
          name: "",
          phone: "0821-9876-5432",
          email: "",
          notes: "Tolong siapkan sedotan kertas"
        },
        subtotal: 85000,
        subtotalLabel: "Rp 85.000",
        tax: 8500,
        taxLabel: "Rp 8.500",
        total: 93500,
        totalLabel: "Rp 93.500",
        status: "ready" as const,
        paymentMethod: "qris" as const,
        paymentStatus: "paid" as const,
        estimatedTime: 10,
        notes: "",
        items: [
          {
            name: "Pistachio Choco",
            quantity: 1,
            unitPrice: 32000,
            unitPriceLabel: "Rp 32.000",
            linePriceLabel: "Rp 37.000",
            category: "Pistachio Series",
            image: "/images/pistachio-choco.jpg",
            options: ["Large (+Rp 5.000)", "Hot", "Whipped Cream", "Caramel Drizzle"]
          },
          {
            name: "Iced Matcha",
            quantity: 2,
            unitPrice: 24000,
            unitPriceLabel: "Rp 24.000",
            linePriceLabel: "Rp 48.000",
            category: "Matcha Club",
            image: "/images/iced-matcha.jpg",
            options: ["Less Sugar", "Extra Ice", "Oat Milk (+Rp 0)"]
          }
        ]
      }
    ];

    sampleOrders.forEach(order => {
      addOrder(order);
    });
  };

  return (
    <button
      onClick={addSampleData}
      className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
    >
      <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">
        add_circle
      </span>
      Tambah Data Sample
    </button>
  );
}