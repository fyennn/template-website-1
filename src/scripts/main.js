const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reduceMotionQuery.matches;

function applyMotionPreferences(element) {
  if (prefersReducedMotion) {
    element.style.animation = 'none';
    element.style.opacity = '1';
    element.style.transform = 'none';
  } else {
    element.style.removeProperty('animation');
    element.style.removeProperty('opacity');
    element.style.removeProperty('transform');
  }
}

function applyDatasetDrivenProperties(element) {
  const delay = Number(element.dataset.animateDelay || 0);
  const duration = Number(element.dataset.animateDuration || 0);

  if (prefersReducedMotion || Number.isNaN(delay) || delay === 0) {
    element.style.removeProperty('--enter-delay');
  } else {
    element.style.setProperty('--enter-delay', `${delay}ms`);
  }

  if (prefersReducedMotion || Number.isNaN(duration) || duration === 0) {
    if (!element.dataset.animateDuration) {
      element.style.removeProperty('--enter-duration');
    }
  } else {
    element.style.setProperty('--enter-duration', `${duration}ms`);
  }
}

function hydrateEntranceAnimations() {
  const processed = new WeakSet();
  const groups = document.querySelectorAll('[data-animate-group]');

  groups.forEach((group) => {
    const items = group.querySelectorAll('.enter-animated');
    const staggerSetting = Number(group.dataset.animateStagger || 80);
    if (prefersReducedMotion || Number.isNaN(staggerSetting)) {
      group.style.removeProperty('--enter-stagger');
    } else {
      group.style.setProperty('--enter-stagger', `${staggerSetting}ms`);
    }

    items.forEach((item, index) => {
      const baseIndex = item.dataset.animateIndex ? Number(item.dataset.animateIndex) : index;
      if (prefersReducedMotion || Number.isNaN(baseIndex)) {
        item.style.removeProperty('--enter-index');
      } else {
        item.style.setProperty('--enter-index', baseIndex);
      }
      applyDatasetDrivenProperties(item);
      applyMotionPreferences(item);
      processed.add(item);
    });
  });

  const singles = document.querySelectorAll('.enter-animated');
  singles.forEach((item) => {
    if (processed.has(item)) {
      return;
    }

    const baseIndex = Number(item.dataset.animateIndex || 0);
    if (prefersReducedMotion || Number.isNaN(baseIndex)) {
      item.style.removeProperty('--enter-index');
    } else {
      item.style.setProperty('--enter-index', baseIndex);
    }

    applyDatasetDrivenProperties(item);
    applyMotionPreferences(item);
  });
}

function hydrateCardAnimations() {
  const grids = document.querySelectorAll('[data-animate-grid]');
  grids.forEach((grid) => {
    const cards = grid.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
      const delay = prefersReducedMotion ? 0 : index;
      card.style.setProperty('--card-index', delay);
      if (prefersReducedMotion) {
        card.style.animation = 'none';
        card.style.opacity = '1';
        card.style.transform = 'none';
      } else {
        card.style.removeProperty('animation');
        card.style.removeProperty('opacity');
        card.style.removeProperty('transform');
      }
    });
  });
}

function attachPressableHandlers(selector, pressedClass) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    const addPressed = () => element.classList.add(pressedClass);
    const removePressed = () => element.classList.remove(pressedClass);

    element.addEventListener('mousedown', addPressed);
    element.addEventListener('touchstart', addPressed, { passive: true });
    element.addEventListener('mouseup', removePressed);
    element.addEventListener('mouseleave', removePressed);
    element.addEventListener('touchend', removePressed);
    element.addEventListener('touchcancel', removePressed);
  });
}

function attachRippleHandlers() {
  if (prefersReducedMotion) {
    return;
  }

  const rippleTargets = document.querySelectorAll('[data-ripple]');
  rippleTargets.forEach((target) => {
    if (target.dataset.rippleAttached === 'true') {
      return;
    }

    target.dataset.rippleAttached = 'true';
    target.addEventListener('click', (event) => {
      const rect = target.getBoundingClientRect();
      const rippleSize = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'button-ripple';
      ripple.style.width = ripple.style.height = `${rippleSize}px`;
      ripple.style.left = `${event.clientX - rect.left - rippleSize / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - rippleSize / 2}px`;
      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

function init() {
  hydrateCardAnimations();
  hydrateEntranceAnimations();
  attachPressableHandlers('.pressable', 'is-pressed');
  attachPressableHandlers('.pill-pressable', 'is-pressed');
  attachRippleHandlers();
}

document.addEventListener('DOMContentLoaded', init);

const reduceMotionListener = (event) => {
  prefersReducedMotion = event.matches;
  hydrateCardAnimations();
  hydrateEntranceAnimations();
  attachRippleHandlers();
};

if (typeof reduceMotionQuery.addEventListener === 'function') {
  reduceMotionQuery.addEventListener('change', reduceMotionListener);
} else if (typeof reduceMotionQuery.addListener === 'function') {
  reduceMotionQuery.addListener(reduceMotionListener);
}
