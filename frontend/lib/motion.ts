const reduceMotionQuery =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

let prefersReducedMotion = reduceMotionQuery?.matches ?? false;

function applyMotionPreferences(element: HTMLElement) {
  if (prefersReducedMotion) {
    element.style.animation = "none";
    element.style.opacity = "1";
    element.style.transform = "none";
  } else {
    element.style.removeProperty("animation");
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
  }
}

function applyDatasetDrivenProperties(element: HTMLElement) {
  const delay = Number(element.dataset.animateDelay || 0);
  const duration = Number(element.dataset.animateDuration || 0);

  if (prefersReducedMotion || Number.isNaN(delay) || delay === 0) {
    element.style.removeProperty("--enter-delay");
  } else {
    element.style.setProperty("--enter-delay", `${delay}ms`);
  }

  if (prefersReducedMotion || Number.isNaN(duration) || duration === 0) {
    if (!element.dataset.animateDuration) {
      element.style.removeProperty("--enter-duration");
    }
  } else {
    element.style.setProperty("--enter-duration", `${duration}ms`);
  }
}

function hydrateEntranceAnimations() {
  const processed = new WeakSet<Element>();
  const groups = document.querySelectorAll<HTMLElement>("[data-animate-group]");

  groups.forEach((group) => {
    const items = group.querySelectorAll<HTMLElement>(".enter-animated");
    const staggerSetting = Number(group.dataset.animateStagger || 80);
    if (prefersReducedMotion || Number.isNaN(staggerSetting)) {
      group.style.removeProperty("--enter-stagger");
    } else {
      group.style.setProperty("--enter-stagger", `${staggerSetting}ms`);
    }

    items.forEach((item, index) => {
      const baseIndex = item.dataset.animateIndex
        ? Number(item.dataset.animateIndex)
        : index;
      if (prefersReducedMotion || Number.isNaN(baseIndex)) {
        item.style.removeProperty("--enter-index");
      } else {
        item.style.setProperty("--enter-index", String(baseIndex));
      }
      applyDatasetDrivenProperties(item);
      applyMotionPreferences(item);
      processed.add(item);
    });
  });

  const singles = document.querySelectorAll<HTMLElement>(".enter-animated");
  singles.forEach((item) => {
    if (processed.has(item)) {
      return;
    }

    const baseIndex = Number(item.dataset.animateIndex || 0);
    if (prefersReducedMotion || Number.isNaN(baseIndex)) {
      item.style.removeProperty("--enter-index");
    } else {
      item.style.setProperty("--enter-index", String(baseIndex));
    }

    applyDatasetDrivenProperties(item);
    applyMotionPreferences(item);
  });
}

function hydrateCardAnimations() {
  const grids = document.querySelectorAll<HTMLElement>("[data-animate-grid]");
  grids.forEach((grid) => {
    const cards = grid.querySelectorAll<HTMLElement>(".product-card");
    cards.forEach((card, index) => {
      const delay = prefersReducedMotion ? 0 : index;
      card.style.setProperty("--card-index", String(delay));
      if (prefersReducedMotion) {
        card.style.animation = "none";
        card.style.opacity = "1";
        card.style.transform = "none";
      } else {
        card.style.removeProperty("animation");
        card.style.removeProperty("opacity");
        card.style.removeProperty("transform");
      }
    });
  });
}

function attachPressableHandlers(selector: string, pressedClass: string) {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const cleanupFns: Array<() => void> = [];

  elements.forEach((element) => {
    const addPressed = () => element.classList.add(pressedClass);
    const removePressed = () => element.classList.remove(pressedClass);

    element.addEventListener("mousedown", addPressed);
    element.addEventListener("touchstart", addPressed, { passive: true });
    element.addEventListener("mouseup", removePressed);
    element.addEventListener("mouseleave", removePressed);
    element.addEventListener("touchend", removePressed);
    element.addEventListener("touchcancel", removePressed);

    cleanupFns.push(() => {
      element.removeEventListener("mousedown", addPressed);
      element.removeEventListener("touchstart", addPressed);
      element.removeEventListener("mouseup", removePressed);
      element.removeEventListener("mouseleave", removePressed);
      element.removeEventListener("touchend", removePressed);
      element.removeEventListener("touchcancel", removePressed);
    });
  });

  return cleanupFns;
}

function attachRippleHandlers() {
  if (prefersReducedMotion) {
    return [];
  }

  const rippleTargets = document.querySelectorAll<HTMLElement>("[data-ripple]");
  const cleanupFns: Array<() => void> = [];

  rippleTargets.forEach((target) => {
    if (target.dataset.rippleAttached === "true") {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const rect = target.getBoundingClientRect();
      const rippleSize = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.className = "button-ripple";
      ripple.style.width = ripple.style.height = `${rippleSize}px`;
      ripple.style.left = `${event.clientX - rect.left - rippleSize / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - rippleSize / 2}px`;
      target.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    };

    target.dataset.rippleAttached = "true";
    target.addEventListener("click", handleClick);

    cleanupFns.push(() => {
      target.removeEventListener("click", handleClick);
    });
  });

  return cleanupFns;
}

export function setupMotionEffects() {
  if (typeof window === "undefined") {
    return () => {};
  }

  prefersReducedMotion = reduceMotionQuery?.matches ?? false;

  hydrateCardAnimations();
  hydrateEntranceAnimations();

  const cleanupFns = [
    ...attachPressableHandlers(".pressable", "is-pressed"),
    ...attachPressableHandlers(".pill-pressable", "is-pressed"),
    ...attachRippleHandlers(),
  ];

  const reduceMotionListener = (event: MediaQueryListEvent) => {
    prefersReducedMotion = event.matches;
    hydrateCardAnimations();
    hydrateEntranceAnimations();
  };

  if (reduceMotionQuery) {
    if (typeof reduceMotionQuery.addEventListener === "function") {
      reduceMotionQuery.addEventListener("change", reduceMotionListener);
      cleanupFns.push(() => {
        reduceMotionQuery.removeEventListener("change", reduceMotionListener);
      });
    } else if (typeof reduceMotionQuery.addListener === "function") {
      reduceMotionQuery.addListener(reduceMotionListener);
      cleanupFns.push(() => {
        reduceMotionQuery.removeListener(reduceMotionListener);
      });
    }
  }

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

export function refreshMotionEffects() {
  if (typeof window === "undefined") {
    return;
  }
  hydrateCardAnimations();
  hydrateEntranceAnimations();
  attachRippleHandlers();
}
