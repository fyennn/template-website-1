"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAdmin, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    const value = searchParams?.get("redirect");
    if (value && value.startsWith("/")) {
      return value;
    }
    return "/admin";
  }, [searchParams]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (isAdmin) {
      router.replace(redirectTarget);
    }
  }, [isAdmin, isReady, redirectTarget, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const success = await login({ email, password });
    setIsSubmitting(false);
    if (success) {
      router.replace(redirectTarget);
    } else {
      setError("Email atau kata sandi tidak valid.");
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f2faf6] via-white to-[#eef5ff] flex items-center justify-center px-4">
        <div className="text-sm text-gray-500 font-medium">Memuat…</div>
      </div>
    );
  }

  if (isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2faf6] via-white to-[#eef5ff] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-emerald-50/80 p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-emerald-500 text-4xl">shield_person</span>
            <h1 className="text-2xl font-semibold text-gray-700">Masuk Admin</h1>
            <p className="text-sm text-gray-500">
              Gunakan kredensial admin untuk mengakses dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                className="w-full rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Masukkan email"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                className="w-full rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Masukkan kata sandi"
                required
              />
            </div>

            {error ? (
              <p className="text-xs font-semibold text-red-500 bg-red-50/60 border border-red-100 rounded-2xl px-4 py-2">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500">
            <p>
              Bukan admin?{" "}
              <Link href="/" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Kembali ke menu
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
