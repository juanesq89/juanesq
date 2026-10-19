/* juanesq.com — GA4 contact events (home pages).
   contact_click {method: whatsapp | email | form_submit}
   generate_lead  — fired by the inquiry form script only after Web3Forms returns success (via window.jqTrack).
   No personal data (name, contact, message) is ever sent. */
(function () {
  var L = (document.documentElement.lang || 'en').slice(0, 2);

  function ev(name, params) {
    try {
      if (typeof window.gtag !== 'function') return;
      params = params || {};
      params.lang = L;
      window.gtag('event', name, params);
    } catch (e) {}
  }
  window.jqTrack = ev;

  function position(a) {
    if (a.closest('#floating-cta')) return 'sticky';
    if (a.closest('#hero')) return 'hero';
    if (a.closest('#contact')) return 'contact';
    return 'body';
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var m = /^https:\/\/wa\.me\//.test(h) ? 'whatsapp'
      : (/^mailto:/i.test(h) || /^https:\/\/mail\.google\.com\//.test(h)) ? 'email' : null;
    if (m) ev('contact_click', { method: m, position: position(a) });
  }, true);

  /* Inquiry form: count a submit attempt only when the browser-side checks pass
     (required fields + consent box), i.e. when the form script will actually send. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.id !== 'inquiry-form') return;
    if (typeof f.checkValidity === 'function' && !f.checkValidity()) return;
    ev('contact_click', { method: 'form_submit', position: 'contact' });
  }, true);
})();
