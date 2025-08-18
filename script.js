/**
 * File: script.js
 * Purpose: Progressive enhancements for the portfolio site.
 *  - Reveal-on-scroll animations (IntersectionObserver)
 *  - Contact form submission via fetch (Formspree)
 *  - Sticky nav shadow on scroll
 *  - Smooth in-page anchor scrolling
 *  - Auto-insert current year in footer
 *
 * Notes:
 *  - Animations respect the user's reduced-motion preference.
 *  - Code is resilient if certain elements/pages aren't present.
 */

/* ================================
 *  Motion Preferences
 * ================================ */

/** True if the user prefers reduced motion (OS accessibility setting). */
const PREFERS_REDUCED_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ================================
 *  Reveal-on-Scroll
 * ================================ */

/**
 * Apply "revealed" state:
 * - Removes initial hidden state utility classes
 * - Adds visible state utilities
 * @param {Element} el - The element to reveal
 */
function revealNow(el) {
  el.classList.remove("opacity-0", "translate-y-6");
  el.classList.add("opacity-100", "translate-y-0");
}

(() => {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return; // Nothing to do on pages without .reveal elements

  if (PREFERS_REDUCED_MOTION) {
    // No animation: reveal immediately
    revealEls.forEach(revealNow);
    return;
  }

  // Animate once when element is ~15% visible in the viewport
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          obs.unobserve(entry.target); // Animate once
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

/* ================================
 *  Contact Form Handling (Formspree)
 * ================================ */

document.addEventListener("DOMContentLoaded", () => {
  /** @type {HTMLFormElement|null} */
  const form = document.getElementById("contact-form");
  if (!form) return; // Skip if current page has no form

  /** @type {HTMLElement|null} */
  const status = document.getElementById("form-status");
  /** @type {HTMLButtonElement|null} */
  const submitBtn = form.querySelector('button[type="submit"]');

  // Make status area accessible if present
  if (status && !status.hasAttribute("aria-live")) {
    status.setAttribute("aria-live", "polite");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!submitBtn) return;

    // UI: disable button while sending
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const formData = new FormData(form);
      const resp = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (resp.ok) {
        // Success: show message + clear fields
        if (status) {
          status.textContent = "✅ Thanks! Your message was sent.";
          status.classList.remove("hidden");
          status.classList.remove("opacity-0"); // ensure visible if previously faded
        }
        form.reset();

        // Auto-hide after 5 seconds with a fade
        if (status) {
          setTimeout(() => {
            status.classList.add("opacity-0");
            setTimeout(() => status.classList.add("hidden"), 500);
          }, 5000);
        }
      } else {
        if (status) {
          status.textContent =
            "❌ Sorry—something went wrong. Please try again.";
          status.classList.remove("hidden");
          status.classList.remove("opacity-0");
        }
      }
    } catch (err) {
      if (status) {
        status.textContent =
          "❌ Network error. Check your connection and try again.";
        status.classList.remove("hidden");
        status.classList.remove("opacity-0");
      }
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

/* ================================
 *  Sticky Nav Shadow on Scroll
 * ================================ */

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("nav");
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 8) {
      nav.classList.add("shadow-md");
    } else {
      nav.classList.remove("shadow-md");
    }
  };

  // Initialize state and listen for scrolls (passive = better perf)
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});

/* ================================
 *  Smooth Scroll for Hash Links
 * ================================ */

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id ? document.querySelector(id) : null;
      if (!target) return;

      e.preventDefault();

      // Respect reduced motion: jump instead of smooth scroll
      if (PREFERS_REDUCED_MOTION) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Optional: update hash without extra jump
      history.pushState(null, "", id);
    });
  });
});

/* ================================
 *  Auto-set the Year in Footer
 * ================================ */

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y && !y.textContent.trim()) {
    y.textContent = new Date().getFullYear();
  }
});

/* ===========================
 *   Accessible Carousel
 * =========================== */
document.addEventListener('DOMContentLoaded', function () {
  const el = document.querySelector('#image-carousel');
  if (!el) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  new Splide(el, {
    perPage: 2,
    gap: '1.5rem',
    padding: { left: '1.25rem', right: '1.25rem' }, // padding inside the track, like your reference
    breakpoints: {
      1024: { perPage: 2 },
      640:  { perPage: 1 },
    },
    arrows: true,
    pagination: true,
    autoplay: false,             // keep it user-controlled
    drag: true,
    lazyLoad: 'nearby',
    speed: prefersReduced ? 0 : 500,
  }).mount();
});