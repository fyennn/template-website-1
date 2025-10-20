"use client";

import Link from "next/link";
import { useState } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { ROLE_DEFAULT_ROUTES } from "@/lib/adminUsers";

const DEFAULT_COLOR_OPTIONS = [
  "#34d399",
  "#60a5fa",
  "#fbbf24",
  "#a855f7",
  "#fb7185",
  "#14b8a6",
  "#6366f1",
  "#f97316",
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AD";
}

export default function AdminProfilePage() {
  const auth = useRequireAdmin();
  const { user, updateProfile, changePassword, isReady } = auth;

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(() => user?.name ?? "");
  const [phone, setPhone] = useState(() => user?.phone ?? "");
  const [avatarInitials, setAvatarInitials] = useState(() => user?.avatarInitials ?? getInitials(user?.name ?? ""));
  const [avatarColor, setAvatarColor] = useState(() => user?.avatarColor ?? DEFAULT_COLOR_OPTIONS[0]);
  const [bio, setBio] = useState(() => user?.bio ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isReady || !user) {
    return null;
  }

  const initials = avatarInitials || getInitials(displayName || user.name);
  const activeColor = avatarColor || DEFAULT_COLOR_OPTIONS[0];

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    if (!user) return;
    const result = await updateProfile({
      name: displayName,
      phone,
      avatarColor: activeColor,
      avatarInitials: initials,
      bio,
    });
    if (result) {
      setProfileMessage("Profil berhasil diperbarui.");
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    if (!newPassword || !confirmPassword) {
      setPasswordError("Kata sandi baru harus diisi.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    const success = await changePassword({ currentPassword, newPassword });
    if (success) {
      setPasswordMessage("Kata sandi berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError("Kata sandi saat ini tidak sesuai.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-white to-[#ecfdf5]">
      <header className="border-b border-emerald-100/50 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500 text-2xl">account_circle</span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Pengaturan Akun</p>
              <h1 className="text-lg font-semibold text-gray-700">Profil Pengguna</h1>
            </div>
          </div>
          <Link
            href={ROLE_DEFAULT_ROUTES[user.role] ?? "/admin"}
            className="rounded-full border border-emerald-200 bg-white/60 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <section className="rounded-3xl border border-emerald-100 bg-white/90 shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
            <div className="flex flex-col items-center gap-4 border-r border-emerald-50/80 pr-0 md:pr-6">
              <div
                className="h-24 w-24 rounded-full grid place-items-center text-2xl font-semibold text-white shadow"
                style={{ backgroundColor: activeColor }}
              >
                {initials}
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-gray-700">{displayName || user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  {user.role}
                </span>
              </div>
              <div className="w-full h-px bg-emerald-50" />
              <div className="space-y-3 text-xs text-gray-500 w-full">
                <div className="flex items-center justify-between">
                  <span>Nomor Kontak</span>
                  <span className="font-semibold text-gray-600">{phone || "-"}</span>
                </div>
                {bio ? (
                  <div>
                    <p className="text-gray-500 mb-1">Catatan</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.currentTarget.value)}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Nama yang ditampilkan"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full rounded-2xl border border-transparent bg-gray-100 px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.currentTarget.value)}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="+62 ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Peran
                  </label>
                  <input
                    type="text"
                    value={user.role}
                    readOnly
                    className="w-full rounded-2xl border border-transparent bg-gray-100 px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Inisial Avatar
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={avatarInitials}
                    onChange={(event) => setAvatarInitials(event.currentTarget.value.toUpperCase())}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Warna Avatar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border ${
                          color === activeColor ? "border-gray-900 ring-2 ring-gray-900/10" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setAvatarColor(color)}
                        aria-label={`Pilih warna ${color}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(event) => setAvatarColor(event.currentTarget.value)}
                      className="h-8 w-12 rounded-lg border border-emerald-100"
                      aria-label="Pilih warna kustom"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  Catatan / Bio Singkat
                </label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.currentTarget.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Tambahkan catatan singkat mengenai tanggung jawab atau jadwal Anda."
                />
              </div>

              {profileMessage ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                  {profileMessage}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white/90 shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <h2 className="text-base font-semibold text-gray-700">Keamanan Akun</h2>
              <p className="text-xs text-gray-500">
                Ganti kata sandi Anda secara berkala untuk menjaga keamanan akun.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.currentTarget.value)}
                  className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="********"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.currentTarget.value)}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Minimal 8 karakter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ulangi kata sandi"
                    required
                  />
                </div>
              </div>

              {passwordError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
                  {passwordError}
                </p>
              ) : null}
              {passwordMessage ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                  {passwordMessage}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-emerald-50/80 bg-emerald-50/40 p-4 text-xs text-gray-600 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Tips Keamanan</h3>
              <ul className="space-y-2 list-disc pl-4">
                <li>Gunakan kombinasi huruf besar, kecil, angka, dan simbol.</li>
                <li>Hindari menggunakan kata sandi yang sama di banyak tempat.</li>
                <li>Keluar dari akun jika menggunakan perangkat bersama.</li>
              </ul>
              <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                <p className="text-[11px] text-gray-500">
                  Jika Anda lupa kata sandi, hubungi pemilik atau manager untuk mereset melalui pengaturan akses pengguna.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
