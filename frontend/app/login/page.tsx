"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ROLE_DEFAULT_ROUTES, isRouteAllowedForRole } from "@/lib/adminUsers";
import { useAuth } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    const query = searchParams?.get("redirect");
    if (user && query && query.startsWith("/") && isRouteAllowedForRole(query, user.role)) {
      return query;
    }
    if (user) {
      return user.defaultRoute || ROLE_DEFAULT_ROUTES[user.role];
    }
    if (query && query.startsWith("/")) {
      return query;
    }
    return "/admin";
  }, [searchParams, user]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (user) {
      router.replace(redirectTarget);
    }
  }, [user, isReady, redirectTarget, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const account = await login({ email, password });
    setIsSubmitting(false);
    if (account) {
      const query = searchParams?.get("redirect");
      const fallback = account.defaultRoute || ROLE_DEFAULT_ROUTES[account.role];
      const nextRoute =
        query && query.startsWith("/") && isRouteAllowedForRole(query, account.role)
          ? query
          : fallback;
      router.replace(nextRoute);
    } else {
      setError("Email atau kata sandi tidak valid.");
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0f132f] flex items-center justify-center px-4">
        <div className="text-sm text-white/60 font-medium">Memuat antarmuka AIVRA…</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[#e8ecff] via-white to-[#f1f6ff] text-slate-700">
      <section className="relative w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="absolute top-8 left-6 flex items-center gap-3">
          <Image
            src="/images/aivra-logo.svg"
            alt="Logo AIVRA"
            width={150}
            height={60}
            priority
          />
        </div>

        <div className="w-full max-w-md rounded-[32px] bg-white/90 backdrop-blur shadow-[0_30px_80px_rgba(15,19,47,0.12)] border border-indigo-50 px-8 py-10 space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.3em] text-indigo-500 uppercase">
              Login Member Area
            </p>
            <h1 className="text-3xl font-semibold text-slate-800">Selamat datang kembali</h1>
            <p className="text-sm text-slate-500">
              Masuk ke pusat kontrol AIVRA untuk mengelola inovasi dan pesanan spesial Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-600">
                E-mail
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="e.g. john@aivra.ai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-600">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition"
                >
                  Lupa kata sandi?
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-[#5f7dff] via-[#6ec8ff] to-[#30f0ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(95,125,255,0.35)] transition hover:shadow-[0_20px_45px_rgba(48,240,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Memproses…" : "Masuk ke AIVRA"}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            <p>
              Tidak punya akun?{" "}
              <Link href="/" className="text-indigo-500 font-semibold hover:text-indigo-600">
                Kembali ke menu utama
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#150b21]">
        <div className="absolute inset-0 opacity-90">
          <Image
            src="/images/background-login.jpg"
            alt="Foto minuman dan camilan di meja kafe"
            fill
            className="object-cover object-center scale-110"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#150b21]/30 to-[#070614]" />

        <div className="absolute bottom-16 left-14 max-w-sm text-white/90 space-y-2">
          <p className="text-sm uppercase tracking-[0.5em] text-cyan-200">Mission Control</p>
          <h2 className="text-3xl font-semibold leading-snug">
            Ekosistem digital untuk memantau kinerja dan eksperimen menu unggulan.
          </h2>
          <p className="text-sm text-white/70">
            Terhubung dengan AIVRA untuk laporan real-time, automasi menu, dan pengalaman pelanggan
            yang lebih personal.
          </p>
        </div>
      </section>
    </div>
  );
}
