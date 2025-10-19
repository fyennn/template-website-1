import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cartStore";

export type HeaderProps = {
  hideSearch?: boolean;
  hideLocation?: boolean;
  title?: string;
  backHref?: string;
};

export function Header({
  hideSearch = false,
  hideLocation = false,
  title,
  backHref,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tableId } = useCart();
  const searchHref = tableId
    ? `/search?table=${encodeURIComponent(tableId)}`
    : "/search";
  const menuHref = tableId
    ? `/menu?table=${encodeURIComponent(tableId)}`
    : "/menu";
  const isSearchPage = pathname === "/search";

  return (
    <header
      className="bg-white shadow-sm flex items-center justify-between p-4"
      data-animate-group="header-primary"
      data-animate-stagger="90"
    >
      {title ? (
        <button
          type="button"
          onClick={() => {
            if (backHref) {
              router.push(backHref);
            } else {
              router.back();
            }
          }}
          className="header-back-button flex items-center gap-1 text-gray-500 hover:text-gray-700 enter-animated enter-from-left enter-duration-short"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          <span className="text-xs font-medium uppercase tracking-[0.2em]">
            Back
          </span>
        </button>
      ) : (
        <div className="flex items-center md:hidden enter-animated enter-from-left enter-duration-short">
          <Image
            alt="SPM Café Logo"
            className="h-8 w-auto mr-4"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyZ62jeX9qRYhWVarbUUcWcQXIm6Iqvp05IVSHRXMYw1cvDCAvM6Xv4wYgprgj56F9T1nii4qBOVxkAUCCxqfAZTWfkE-akpReVEqmDOGhSfCh7va2_uXvDyj4v3XDGyvvfZD6aF4uCe0sVI8B1jwqKnXaVYTy36mRdgSHJrmyR_tSO6xRBoLbIn202gydshDq9Npx9PId30JOUs86Q_hMfRSEy5nLCuEaFgM6JlcCecyGxxqkV_9GHqUbLli3fRUbdQNc2t2EMeM"
            width={128}
            height={32}
            priority
          />
        </div>
      )}
      {title ? (
        <div
          className="enter-animated enter-duration-short text-center flex-1"
          data-animate-delay="100"
        >
          <p className="text-base font-semibold text-gray-800">{title}</p>
        </div>
      ) : (
        <div
          className="flex items-center enter-animated enter-duration-short"
          data-animate-delay="100"
        >
          {!hideLocation ? (
            <span className="material-symbols-outlined text-gray-600 mr-2">
              location_on
            </span>
          ) : null}
          <div className={hideLocation ? "ml-0" : ""}>
            <p className="text-xs text-gray-500">Pick up di store</p>
            <p className="text-sm font-bold text-gray-800">SPM Café - Menteng</p>
          </div>
        </div>
      )}
      {hideSearch ? (
        <div
          className="flex items-center enter-animated enter-from-right enter-duration-short"
          data-animate-delay="160"
        >
          {!hideLocation ? (
            <span className="material-symbols-outlined text-gray-600 mr-2">
              location_on
            </span>
          ) : null}
          <div className="text-right">
            <p className="text-xs text-gray-500">Pick up di store</p>
            <p className="text-sm font-bold text-gray-800">SPM Café - Menteng</p>
          </div>
        </div>
      ) : (
        isSearchPage ? (
          <button
            type="button"
            onClick={() => router.push(menuHref)}
            className="text-gray-600 enter-animated enter-from-right enter-duration-short"
            data-animate-delay="160"
            aria-label="Tutup pencarian"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        ) : (
          <Link
            href={searchHref}
            className="text-gray-600 enter-animated enter-from-right enter-duration-short"
            data-animate-delay="160"
            aria-label="Cari menu"
          >
            <span className="material-symbols-outlined">search</span>
          </Link>
        )
      )}
    </header>
  );
}
