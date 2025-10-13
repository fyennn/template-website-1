"use client";

import { useState } from "react";
import type { CustomerInfo } from "@/lib/orderStore";

interface CustomerInfoFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function CustomerInfoForm({ onSubmit, onSkip, isLoading = false }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CustomerInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 space-y-6">
      <div className="text-center space-y-2">
        <span className="material-symbols-outlined text-emerald-500 text-3xl">person_add</span>
        <h2 className="text-xl font-semibold text-gray-900">Informasi Customer</h2>
        <p className="text-sm text-gray-600">
          Isi informasi berikut untuk memudahkan kami menghubungi Anda (opsional)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Lengkap
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange("name")}
            placeholder="Masukkan nama lengkap"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Nomor Telepon
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handleChange("phone")}
            placeholder="08xx-xxxx-xxxx"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email (Opsional)
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange("email")}
            placeholder="nama@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Catatan Khusus (Opsional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={handleChange("notes")}
            placeholder="Contoh: Alergi kacang, extra hot, dll."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Memproses..." : "Lanjutkan ke Pembayaran"}
          </button>
          
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="w-full border border-emerald-200 text-emerald-600 py-3 px-6 rounded-lg font-semibold hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Lewati & Lanjutkan
          </button>
        </div>
      </form>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Informasi ini akan membantu kami memberikan pelayanan yang lebih baik.</p>
        <p>Data Anda aman dan tidak akan dibagikan kepada pihak ketiga.</p>
      </div>
    </div>
  );
}