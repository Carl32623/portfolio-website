/* MailerLite Universal */
    // (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
    // .push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
    // n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
    // (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
    // ml('account', '1783945');


// subform.js — single source of truth
(function () {
  function wireUp(root) {
    if (!root) return false;

    const form = root.querySelector('form.ml-block-form');
    if (!form) return false;

    // Ensure the form won't open a new tab
    form.removeAttribute('target');

    const body    = root.querySelector('.ml-form-embedBody');
    const success = root.querySelector('.ml-form-successBody');
    const email   = form.querySelector('input[name="fields[email]"]');
    const button  = form.querySelector('.nl-button .primary') || form.querySelector('button[type="submit"]');

    const showSuccess = () => {
      if (body)    body.style.display = 'none';
      if (success) success.style.display = 'block';
    };

    const getCaptchaToken = () =>
      (form.querySelector('textarea[name="g-recaptcha-response"]') || {}).value || '';

    // Bind exactly once
    if (form.__mlBound) return true;
    form.__mlBound = true;

    form.addEventListener('submit', (e) => {
      e.preventDefault(); // stop navigation to JSON

      // Basic email check
      const val = (email?.value || '').trim();
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        email?.focus();
        email?.setAttribute('aria-invalid', 'true');
        return;
      }

      // Require captcha
      const token = getCaptchaToken();
      if (!token) {
        root.querySelector('.g-recaptcha')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = 'Subscribing…';
      }

      // Fire JSONP endpoint without leaving the page
      const qs = new URLSearchParams(new FormData(form)).toString();
      fetch(form.action + '?' + qs, { method: 'GET', mode: 'no-cors' })
        .catch(() => {}) // opaque under no-cors; ignore
        .finally(showSuccess);
    });

    return true;
  }

  function tryWireOnce() {
    return wireUp(document.getElementById('mlb2-30606205'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (tryWireOnce()) return;

    // If the component is injected after load, observe DOM until it appears
    const mo = new MutationObserver(() => {
      if (tryWireOnce()) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });
})();
