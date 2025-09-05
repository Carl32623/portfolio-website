/**
 * ===========================================================
 * File: script.js
 * Project: Carl LaLonde — Portfolio
 * Purpose: Progressive enhancements (safe to run on any page)
 *
 * Features
 *  - Reveal-on-scroll animations (IntersectionObserver)
 *  - Contact form (Formspree) with accessible status updates
 *  - Sticky nav shadow on scroll
 *  - Smooth in-page anchor scrolling (respects reduced motion)
 *  - Auto-insert current year in footer
 *  - Image carousel (Splide) with a11y-friendly defaults
 *  - YouTube modal with robust URL parsing (shorts/watch/etc.)
 *  - HTML partial loader via [data-include] + token replacement
 *  - Optional Giscus comments auto-mount
 *
 * Notes
 *  - All modules no-op if required elements are missing.
 *  - Motion respects OS “prefers-reduced-motion”.
 *  - Includes assume same-origin partials (recommended).
 *  - Keep JS idempotent: handlers are delegated/bind-once.
 * ===========================================================
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
 * Apply visible state by removing initial "hidden" utilities
 * and adding their "shown" counterparts.
 * Tailwind expectation: elements start with `opacity-0 translate-y-6`.
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

  // Reveal once when ~15% of the element is visible.
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

// /* ================================
//  *  Contact Form Handling (Formspree)
//  * ================================ */

// document.addEventListener("DOMContentLoaded", () => {
//   /** @type {HTMLFormElement|null} */
//   const form = document.getElementById("contact-form");
//   if (!form) return; // Skip if current page has no form

//   /** @type {HTMLElement|null} */
//   const status = document.getElementById("form-status");
//   /** @type {HTMLButtonElement|null} */
//   const submitBtn = form.querySelector('button[type="submit"]');

//   // Make status area accessible if present
//   if (status && !status.hasAttribute("aria-live")) {
//     status.setAttribute("aria-live", "polite");
//   }

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     if (!submitBtn) return;

//     // UI: disable button while sending
//     const originalText = submitBtn.textContent;
//     submitBtn.disabled = true;
//     submitBtn.textContent = "Sending...";

//     try {
//       const formData = new FormData(form);
//       const resp = await fetch(form.action, {
//         method: form.method,
//         body: formData,
//         headers: { Accept: "application/json" },
//       });

//       if (resp.ok) {
//         // Success: show message + clear fields
//         if (status) {
//           status.textContent = "✅ Thanks! Your message was sent.";
//           status.classList.remove("hidden");
//           status.classList.remove("opacity-0"); // ensure visible if previously faded
//         }
//         form.reset();

//         // Auto-hide after 5 seconds with a fade
//         if (status) {
//           setTimeout(() => {
//             status.classList.add("opacity-0");
//             setTimeout(() => status.classList.add("hidden"), 500);
//           }, 5000);
//         }
//       } else {
//         if (status) {
//           status.textContent =
//             "❌ Sorry—something went wrong. Please try again.";
//           status.classList.remove("hidden");
//           status.classList.remove("opacity-0");
//         }
//       }
//     } catch (err) {
//       if (status) {
//         status.textContent =
//           "❌ Network error. Check your connection and try again.";
//         status.classList.remove("hidden");
//         status.classList.remove("opacity-0");
//       }
//     } finally {
//       // Restore button
//       submitBtn.disabled = false;
//       submitBtn.textContent = originalText;
//     }
//   });
// });

/* ================================
 * Contact Form → Spring Boot API
 * ================================ */
document.addEventListener("DOMContentLoaded", () => {
  /** @type {HTMLFormElement|null} */
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Use your Cloud Run URL in production, localhost for dev
  const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
  const API_BASE = IS_LOCAL
    ? "http://127.0.0.1:8080"
    : "https://portfolio-contact-753288759454.us-central1.run.app";

  let busy = false;

  function showStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.remove("hidden", "opacity-0");
    statusEl.classList.toggle("text-green-600", ok);
    statusEl.classList.toggle("text-red-600", !ok);
    if (ok) {
      setTimeout(() => {
        statusEl.classList.add("opacity-0");
        setTimeout(() => statusEl.classList.add("hidden"), 500);
      }, 5000);
    }
  }

  const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // simple client check

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy || !submitBtn) return; // prevent double-clicks

    // honeypot: if filled, pretend success
    const hp = /** @type {HTMLInputElement|null} */(form.querySelector("#website"));
    if (hp && hp.value.trim()) {
      showStatus("✅ Thanks! Your message was sent.", true);
      form.reset();
      return;
    }

    const payload = {
      name: form.name?.value.trim(),
      email: form.email?.value.trim(),
      subject: form.subject?.value.trim(),
      message: form.message?.value.trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      showStatus("❌ Please fill in all fields.", false);
      return;
    }
    if (!EMAIL_RX.test(payload.email)) {
      showStatus("❌ Please enter a valid email address.", false);
      return;
    }

    // UI lock
    busy = true;
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);

      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });

      clearTimeout(t);

      if (res.ok) {
        showStatus("✅ Thanks! Your message was sent.", true);
        form.reset();
        return;
      }

      // try to read JSON error from your Spring handlers
      let detail = "";
      try {
        const data = await res.json();
        // Map your server codes to friendly messages
        if (data?.code === "invalid_email") {
          detail = "Invalid email. Please double-check it.";
        } else if (data?.code === "validation_failed") {
          detail = "Please correct the highlighted fields.";
        } else if (data?.code === "smtp_error" || data?.code === "smtp_unavailable" || data?.code === "smtp_auth_failed") {
          detail = "Email service temporarily unavailable. Please try again later.";
        } else if (data?.message) {
          detail = data.message;
        }
      } catch {
        // fallback to text
        const txt = await res.text().catch(() => "");
        if (txt) detail = txt.slice(0, 200);
      }

      showStatus(`❌ Sorry—something went wrong.${detail ? " " + detail : ""}`, false);
    } catch (err) {
      if (err && (err.name === "AbortError")) {
        showStatus("❌ Request timed out. Please try again.", false);
      } else {
        showStatus("❌ Network error. Please try again.", false);
      }
    } finally {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalText || "Send Message";
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

/* ================================
 *  YouTube Modal (robust parsing)
 *  Elements required:
 *    - #video-modal  (container with [data-close] elements inside)
 *    - #video-iframe (iframe where src is set)
 *    - [data-video]  (triggers with video URL or ID)
 *    - #video-fallback (optional external link)
 * ================================ */
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

  /**
   * Parse start time from ?t=, &start=, or hash (#1m20s).
   * Accepts raw seconds or h/m/s notation.
   * @param {URL} u
   * @returns {number}
   */
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

  /**
   * Parse a YouTube input (ID, watch URL, share URL, shorts URL).
   * @param {string} input
   * @returns {{id:string,start:number}|null}
   */
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

  /**
   * Open the modal and start playback.
   * Accepts either a raw video ID or any YouTube URL.
   * @param {string} videoInput
   */
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

  /** Close modal and stop playback. */
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


/* ================================
 *  Giscus (GitHub Discussions) Mount
 *  Usage: Place <div id="giscus_thread" data-...> on pages with comments.
 * ================================ */

/**
 * Inject giscus client script once into #giscus_thread.
 * Copies any data-* attributes from the container to the script.
 */
function mountGiscus() {
  const container = document.querySelector('#giscus_thread');
  if (!container || container.querySelector('iframe')) return; // already mounted

  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';

  // copy data-* attributes from container to script tag
  Array.from(container.attributes).forEach((a) => {
    if (a.name.startsWith('data-')) s.setAttribute(a.name, a.value);
  });

  container.appendChild(s);
}

/* ================================
 *  Unified Include Loader
 *  Loads partials into any element with [data-include="..."].
 *  Emits: `includes:ready` on document when complete.
 * ================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const nodes = document.querySelectorAll("[data-include]");
  await Promise.all(Array.from(nodes).map(async (el) => {
    el.classList.add("is-loading");
    const url = el.getAttribute("data-include");
    try {
      let html = await (await fetch(url)).text();

      // optional token replacement for blog header partials
      if (el.id === "blog-header") {
        html = html
          .replaceAll("{{title}}", el.dataset.title || "Projects, Pivots & Pawprints")
          .replaceAll("{{subtitle}}", el.dataset.subtitle || "Notes on projects, learning, and dogs.");
      }

      el.innerHTML = html;

      // re-execute any <script> tags from the included HTML
      el.querySelectorAll("script").forEach((old) => {
        const s = document.createElement("script");
        Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
        s.text = old.textContent || "";
        old.replaceWith(s);
      });

      // footer year if present
      const y = el.querySelector("#year");
      if (y && !y.textContent.trim()) y.textContent = new Date().getFullYear();

    } catch (e) {
      console.error("Include failed:", url, e);
    } finally {
      el.classList.remove("is-loading");
      el.classList.add("is-ready");
    }
  }));

  // Mount giscus if the container exists on this page.
  if (typeof mountGiscus === "function") mountGiscus();

  // Notify any listeners that includes are ready.
  document.dispatchEvent(new Event("includes:ready"))
});



/* ================================
 *  Mobile Nav (delegated, bind-once)
 *  Elements expected in included navbar:
 *    - #navToggle (button with aria-expanded)
 *    - #mobileMenu (menu panel)
 *    - #navBackdrop (optional backdrop)
 * ================================ */
(function () {
  if (window.__navBound) return;
  window.__navBound = true;

  function getEls() {
    return {
      btn: document.getElementById('navToggle'),
      menu: document.getElementById('mobileMenu'),
      backdrop: document.getElementById('navBackdrop'),
    };
  }

  /** Open the mobile menu (updates aria & page scroll lock). */
  function openMenu() {
    const { btn, menu, backdrop } = getEls();
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.remove('hidden');
    backdrop?.classList.remove('hidden');
    document.documentElement.classList.add('overflow-hidden');
  }

  /** Close the mobile menu (updates aria & page scroll lock). */
  function closeMenu() {
    const { btn, menu, backdrop } = getEls();
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
    backdrop?.classList.add('hidden');
    document.documentElement.classList.remove('overflow-hidden');
  }

  function isOpen() {
    const { btn } = getEls();
    return btn?.getAttribute('aria-expanded') === 'true';
  }

  // Toggle on button
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#navToggle')) return;
    isOpen() ? closeMenu() : openMenu();
  });

  // Close on backdrop
  document.addEventListener('click', (e) => {
    if (e.target.closest('#navBackdrop')) closeMenu();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const insideMenu = e.target.closest('#mobileMenu');
    const onToggle = e.target.closest('#navToggle');
    if (!onToggle && !insideMenu && isOpen()) closeMenu();
  });

  // Close on any mobile menu link
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#mobileMenu a');
    if (link) closeMenu();
  });

  // Escape closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });

  // Optional: close on scroll
  window.addEventListener('scroll', () => {
    if (isOpen()) closeMenu();
  }, { passive: true });

  // If includes are injected after DOMContentLoaded, ensure elements exist before first use
  document.addEventListener('includes:ready', () => {/* no-op; handlers are delegated */}, { once: true });
})();
