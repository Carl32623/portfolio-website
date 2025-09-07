/* /assets/js/deck-carousel.js
   Deck Carousel — vanilla JS, safe for late-inserted HTML (data-include)
   - Fanned deck layout with dynamic transforms
   - Click/tap to open lightbox (with caption)
   - Keyboard: ←/→ navigate, Esc to close
   - Swipe gestures on mobile
   - Auto-inits when carousels are injected later
*/

"use strict";

/* ---------- Bootstrap so late-inserted carousels also init ---------- */
const __deckInited = new WeakSet();

function initAnyDecks() {
  document.querySelectorAll("[data-deck-carousel]").forEach((el) => {
    if (!__deckInited.has(el)) {
      initDeckCarousel(el);
      __deckInited.add(el);
    }
  });
}

// Run after parse and after full load
document.addEventListener("DOMContentLoaded", initAnyDecks);
window.addEventListener("load", initAnyDecks);

// If your include loader emits a custom event, we'll catch it too
window.addEventListener("includes:loaded", initAnyDecks);

// Watch the DOM for injected components (from data-include)
const __deckMO = new MutationObserver(() => initAnyDecks());
__deckMO.observe(document.documentElement, { childList: true, subtree: true });

/* ---------- Carousel core ---------- */
function initDeckCarousel(root) {
  const track = root.querySelector(".deck-track");
  const cards = Array.from(root.querySelectorAll(".deck-card"));
  const prevBtn = root.querySelector(".deck-nav--prev");
  const nextBtn = root.querySelector(".deck-nav--next");

  const lb = root.querySelector(".deck-lightbox");
  const lbImg = root.querySelector(".deck-lightbox__img");
  const lbCaption = root.querySelector(".deck-lightbox__caption");
  const lbClose = root.querySelector(".deck-lightbox__close");
  const lbPrev = root.querySelector(".deck-lightbox__prev");
  const lbNext = root.querySelector(".deck-lightbox__next");

  if (!track || !cards.length) return;

  // Make the deck focusable so arrow keys work when the deck is focused
  if (!root.hasAttribute("tabindex")) root.tabIndex = 0;

  let current = Math.floor(cards.length / 2); // start centered (looks nice)
  let lightboxIndex = 0;
  let cardRect = null;

  const measure = () => {
    if (!cards[0]) return;
    cardRect = cards[0].getBoundingClientRect();
    render();
  };

  // Measure when images are ready; also on resize
  window.addEventListener("load", measure, { once: true });
  window.addEventListener("resize", debounce(measure, 100));
  // In case load already fired before this was attached, do a next-frame measure
  requestAnimationFrame(measure);

  function render() {
    if (!cardRect) cardRect = cards[0].getBoundingClientRect();
    const containerRect = track.getBoundingClientRect();

    const baseW   = cardRect.width || containerRect.width * 0.6;
    const spacing = Math.min(baseW * 0.58, containerRect.width * 0.45);
    const maxTilt = 14;   // degrees
    const tiltStep = -8;  // degrees per offset (negative so left/right look natural)

    cards.forEach((card, i) => {
        const offset     = i - current;                 // negative = left, positive = right
        const translateX = offset * spacing;
        const rotate     = clamp(-offset * tiltStep, -maxTilt, maxTilt);
        const scale      = 1 - Math.min(Math.abs(offset) * 0.06, 0.40);

        // Position/rotation/scale via CSS vars (used in CSS transform)
        card.style.setProperty('--tx',  `${translateX}px`);
        card.style.setProperty('--rot', `${rotate}deg`);
        card.style.setProperty('--sc',  scale);

        // Which side of the center am I on? (for hover spin direction)
        const side = offset === 0 ? 0 : (offset < 0 ? -1 : 1);
        card.style.setProperty('--side', side);

        // --- Depth of field: further from center = more blur + slight dim/desat ---
        const depth    = Math.abs(offset);
        const blurPx   = Math.min(depth * 1.6, 6);                 // tune max blur
        const bright   = depth === 0 ? 1 : Math.max(0.78, 1 - depth * 0.08);
        const saturate = depth === 0 ? 1 : Math.max(0.80, 1 - depth * 0.10);

        card.style.setProperty('--blur',   depth ? `${blurPx}px` : '0px');
        card.style.setProperty('--bright', String(bright));
        card.style.setProperty('--sat',    String(saturate));

        // Stacking + a11y
        card.style.zIndex = String(1000 - depth);
        card.setAttribute('aria-hidden', String(i !== current));
        card.style.opacity = 1;
    });

    const disabled = cards.length <= 1;
    if (prevBtn) prevBtn.disabled = disabled;
    if (nextBtn) nextBtn.disabled = disabled;
    }


  // Deck navigation
  function go(delta) { goTo(current + delta); }
  function goTo(index) { current = mod(index, cards.length); render(); }

  // Lightbox controls
  function openLightbox(index) {
    lightboxIndex = mod(index, cards.length);
    const card = cards[lightboxIndex];
    const img = card.querySelector("img");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || "";
    lbCaption.textContent = card.dataset.desc || "";
    lb.hidden = false;
    document.documentElement.style.overflow = "hidden"; // prevent background scroll
    lbClose.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.documentElement.style.overflow = "";
    const hit = cards[lightboxIndex].querySelector(".deck-card__hit");
    if (hit) hit.focus();
  }

  function lightboxStep(delta) {
    lightboxIndex = mod(lightboxIndex + delta, cards.length);
    const card = cards[lightboxIndex];
    const img = card.querySelector("img");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || "";
    lbCaption.textContent = card.dataset.desc || "";
    current = lightboxIndex; // keep deck centered on viewed image
    render();
  }

  // Open handlers per card
  cards.forEach((card, i) => {
    const button = card.querySelector(".deck-card__hit");
    if (!button) return;
    button.addEventListener("click", () => openLightbox(i));
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  // Deck arrows
  prevBtn && prevBtn.addEventListener("click", () => go(-1));
  nextBtn && nextBtn.addEventListener("click", () => go(1));

  // Keyboard on deck (when lightbox is closed)
  root.addEventListener("keydown", (e) => {
    if (!lb.hidden) return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  // Lightbox controls
  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => lightboxStep(-1));
  lbNext.addEventListener("click", () => lightboxStep(1));

  // Close on backdrop click
  lb.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox();
  });

  // Keyboard inside lightbox
  lb.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxStep(-1);
    if (e.key === "ArrowRight") lightboxStep(1);
  });

  // Swipe gestures
  makeSwipeable(track, { onLeft: () => go(1), onRight: () => go(-1) });
  makeSwipeable(lb,    { onLeft: () => lightboxStep(1), onRight: () => lightboxStep(-1) });

  // First paint
  render();
}

/* ---------- Utilities ---------- */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function mod(n, m) { return ((n % m) + m) % m; }
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function makeSwipeable(el, { onLeft, onRight }) {
  if (!el) return;
  let x0 = null, y0 = null;
  const THRESH = 30, MAX_ANGLE = 25;

  el.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    x0 = t.clientX; y0 = t.clientY;
  }, { passive: true });

  el.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;
    const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
    if (Math.abs(dx) > THRESH && angle < MAX_ANGLE) {
      if (dx < 0 && onLeft) onLeft();
      if (dx > 0 && onRight) onRight();
    }
    x0 = y0 = null;
  }, { passive: true });
}
