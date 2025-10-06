import Image from "next/image";

export function Header() {
  return (
    <header
      className="sticky top-0 z-20 bg-white shadow-sm flex items-center justify-between p-4"
      data-animate-group="header-primary"
      data-animate-stagger="90"
    >
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
      <div
        className="flex items-center enter-animated enter-duration-short"
        data-animate-delay="100"
      >
        <span className="material-symbols-outlined text-gray-600 mr-2">
          location_on
        </span>
        <div>
          <p className="text-xs text-gray-500">Pick up di store</p>
          <p className="text-sm font-bold text-gray-800">SPM Café - Menteng</p>
        </div>
      </div>
      <button
        className="text-gray-600 enter-animated enter-from-right enter-duration-short"
        data-animate-delay="160"
        type="button"
        aria-label="Cari menu"
      >
        <span className="material-symbols-outlined">search</span>
      </button>
    </header>
  );
}
