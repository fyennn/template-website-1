import Link from "next/link";
import { formatTableLabel } from "@/lib/tables";

type TableAccessBlockerProps = {
  tableSlug: string | null;
  retryHref?: string;
};

export function TableAccessBlocker({
  tableSlug,
  retryHref = "/menu",
}: TableAccessBlockerProps) {
  return (
    <div className="p-6 pb-24 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md rounded-3xl bg-white/85 backdrop-blur border border-emerald-50/80 p-8 text-center space-y-4 shadow-lg">
        <span className="material-symbols-outlined text-emerald-500 text-4xl">qr_code_2</span>
        <p className="text-lg font-semibold text-gray-700">
          {tableSlug ? "QR Tidak Dapat Digunakan" : "Scan QR Diperlukan"}
        </p>
        <p className="text-sm text-gray-500">
          {tableSlug ? (
            <>
              Maaf, QR untuk{" "}
              <span className="font-semibold text-gray-700">
                {formatTableLabel(tableSlug)}
              </span>{" "}
              sementara tidak aktif. Silakan hubungi kasir atau pindah ke meja lain.
            </>
          ) : (
            <>Mohon scan QR yang tersedia di meja untuk memulai pemesanan.</>
          )}
        </p>
        <div className="flex justify-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition"
          >
            Kembali ke Beranda
          </Link>
          {tableSlug ? (
            <Link
              href={retryHref}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition"
            >
              Coba Lagi
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
