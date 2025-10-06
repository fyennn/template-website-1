export function CartFab() {
  return (
    <div className="fixed bottom-6 right-6 z-30">
      <button
        className="shop-fab enter-animated enter-pop enter-duration-long"
        data-animate-delay="320"
        type="button"
        aria-label="Buka keranjang"
      >
        <span className="material-symbols-outlined">shopping_bag</span>
        <span className="absolute -top-1 -right-1 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          2
        </span>
      </button>
    </div>
  );
}
