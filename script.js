//Reveal-on-scroll using IntersectionObserver

//Respect users who prefer reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealNow(el) {
    //Remove the "hidden state"
    el.classList.remove('opacity-0', 'translate-y-6');
    //Add the "visible state"
    el.classList.add('opacity-100', 'translate-y-0');
}

if (prefersReducedMotion) {
    //Show everything immediately without animation
    document.querySelectorAll('.reveal').forEach(revealNow);
} else {
    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    revealNow(entry.target);
                    obs.unobserve(entry.target);  //animate once
                }
            });
        },
        { threshold: 0.15 }  //reveal when ~15% of the element is visible
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    const submitBtn = form.querySelector('button[type="submit"');

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        //UI: disable button while sending
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        try {
            const formData = new FormData(form);
            const resp = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: { Accept: "application/json"},
            });

            if (resp.ok) {
                // Success: show message + clear fields
                status.textContent = "✅ Thanks!  Your message was sent.";
                status.classList.remove("hidden");
                form.reset();

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    status.classList.add("opacity-0");
                    setTimeout(() => status.classList.add("hidden"), 500);
                }, 5000);
            } else {
                status.textContent = "❌ Sorry - something went wrong. Please try again.";
                status.classList.remove("hidden");
            }
        } catch (err) {
            status.textContent = "❌ Network error. Check your connection and try again.";
            status.classList.remove("hidden");
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

//Sticky Nav: add shadow when scroll
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const onScroll = () => {
        if (window.scrollY > 8) {
            nav.classList.add('shadow-md');
        } else {
            nav.classList.remove('shadow-md');
        }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true});
});

//Smooth scroll for hash links 
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});

//Auto-set the year
document.addEventListener('DOMContentLoaded', () => {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
});

