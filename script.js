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

// ===== YouTube modal for project demo (robust + fallback) =====
document.addEventListener("DOMContentLoaded", () => {
  const modal  = document.getElementById("video-modal");
  const iframe = document.getElementById("video-iframe");
  const extLink = document.getElementById("video-fallback");
  if (!modal || !iframe) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AUTOPLAY = prefersReduced ? 0 : 1;
  const ORIGIN   = encodeURIComponent(location.origin);

  // Build final embed URL
  const buildEmbed = (id, start) => {
    const qs = new URLSearchParams({
      rel: "0",
      autoplay: String(AUTOPLAY),
      origin: location.origin,   // helps some playback contexts
      playsinline: "1",
      modestbranding: "1"
    });
    if (start) qs.set("start", String(start));
    return `https://www.youtube.com/embed/${id}?${qs.toString()}`;
  };

  // Build a normal watch URL for the "Open on YouTube" link
  const buildWatch = (id, start) => {
    const qs = new URLSearchParams({ v: id });
    if (start) qs.set("t", String(start));
    return `https://www.youtube.com/watch?${qs.toString()}`;
  };

  // Parse timestamps like ?t=30, &start=25, or #t=1m20s
  const getStart = (u) => {
    const raw = u.searchParams.get("t") || u.searchParams.get("start") || u.hash.replace("#", "");
    if (!raw) return 0;
    const m = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i.exec(raw);
    if (m) {
      const h  = parseInt(m[1] || "0", 10);
      const mm = parseInt(m[2] || "0", 10);
      const s  = parseInt(m[3] || "0", 10) || parseInt(raw, 10) || 0;
      return h * 3600 + mm * 60 + s;
    }
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
  };

  // Return { id, start } from any input
  const parseVideo = (input) => {
    try {
      if (/^[\w-]{10,12}$/.test(input)) return { id: input, start: 0 };
      const u = new URL(input);
      const start = getStart(u);
      const host = u.hostname.toLowerCase().replace(/^www\./, "");
      if (host === "youtu.be") {
        const id = u.pathname.replace(/^\/+/, "").split(/[/?#]/)[0];
        return { id, start };
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.replace(/^\/shorts\//, "").split(/[/?#]/)[0];
        return { id, start };
      }
      const v = u.searchParams.get("v");
      if (v) return { id: v, start };
      return null;
    } catch {
      return null;
    }
  };

  const open = (videoInput) => {
    const parsed = parseVideo(videoInput);
    // If we couldn't parse, just try to show whatever we got and set the fallback link
    if (!parsed) {
      iframe.src = videoInput;
      if (extLink) extLink.href = videoInput;
    } else {
      const { id, start } = parsed;
      iframe.src = buildEmbed(id, start);
      if (extLink) extLink.href = buildWatch(id, start);
    }

    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    modal.querySelector("[data-close]")?.focus();
  };

  const close = () => {
    iframe.src = ""; // stop playback
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  };

  // Open on any element with [data-video]
  document.querySelectorAll("[data-video]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const url = el.getAttribute("data-video");
      if (url) open(url);
    });
  });

  // Close handlers
  modal.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("hidden") && e.key === "Escape") close();
  });
}); 

// Load components
function loadComponent(targetId, url, after) {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  fetch(url).then(r => r.text()).then(html => {
    mount.innerHTML = html;
    if (after) after(mount);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar", "/components/navbar.html");
  loadComponent("footer", "/components/footer.html", (root) => {
    const y = root.querySelector("#year");
    if (y) y.textContent = new Date().getFullYear();
  });
});

// BLOG HEADER (optional on pages)
(() => {
  const host = document.getElementById('blog-header');
  if (!host) return;

  fetch('/components/blog-header.html')
    .then(r => r.text())
    .then(tpl => {
      const title = host.dataset.title || 'Projects, Pivots & Pawprints';
      const subtitle = host.dataset.subtitle || 'Notes on projects, learning, and dogs.';
      host.innerHTML = tpl
        .replaceAll('{{title}}', title)
        .replaceAll('{{subtitle}}', subtitle);
    })
    .catch(console.error);
})();