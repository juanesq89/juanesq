/* juanesq.com — GA4 events (home, guides, /book/, about). Loaded on every page with ?v=N; bump N when this file changes.
   book_click      {page, position}  — any link to /book/, /es/book/ or /pt/book/
   book_form_start {plan}            — first interaction with the booking form (fired by the /book/ script via jqTrack)
   book_submit     {plan, area}      — booking request accepted (fired by the /book/ script via jqTrack)
   whatsapp_click  {page, position}  — wa.me links (booking questions only)
   outbound_site   {to, page}        — links to the sister sites (gotbom, preverdict, nohulaw)
   contact_click   {method, position} / generate_lead — kept from the earlier home-page setup.
   Every call is a no-op when gtag is missing (blocked, offline, local preview). No personal data is ever sent.
   Also: remembers the page and area the visitor came from (sessionStorage) so /book/ can send source_path + area,
   and switches [data-cal-text] copy when /js/booking-config.js has a calendar link. */
(function () {
  var H = document.documentElement, L = (H.lang || 'en').slice(0, 2);
  var SISTERS = ['gotbom.com', 'preverdict.net', 'nohulaw.com'];

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
    var p = a.closest('[data-pos]');
    if (p) return p.getAttribute('data-pos');
    if (a.closest('#floating-cta')) return 'sticky';
    if (a.closest('.nav')) return 'nav';
    if (a.closest('#hero')) return 'hero';
    if (a.closest('#contact')) return 'contact';
    if (a.closest('.article-cta')) return 'guide_box';
    if (a.closest('footer')) return 'footer';
    return 'body';
  }

  function remember() {
    try {
      if (/^\/(es\/|pt\/)?book\//.test(location.pathname)) return;
      sessionStorage.setItem('jq_src', JSON.stringify({ path: location.pathname, area: H.getAttribute('data-area') || '' }));
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '', u;
    try { u = new URL(h, location.href); } catch (x) { return; }
    var page = location.pathname, pos = position(a);
    if (u.origin === location.origin && /^\/(es\/|pt\/)?book\/?$/.test(u.pathname)) {
      remember();
      ev('book_click', { page: page, position: pos });
      return;
    }
    if (/^https:\/\/wa\.me\//.test(h)) {
      ev('whatsapp_click', { page: page, position: pos });
      ev('contact_click', { method: 'whatsapp', position: pos });
      return;
    }
    if (/^mailto:/i.test(h) || /^https:\/\/mail\.google\.com\//.test(h)) {
      ev('contact_click', { method: 'email', position: pos });
      return;
    }
    var host = u.hostname.replace(/^www\./, '');
    if (SISTERS.indexOf(host) >= 0) ev('outbound_site', { to: host, page: page });
  }, true);

  /* Home inquiry form (if present): count a submit attempt only when the browser-side checks pass. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.id !== 'inquiry-form') return;
    if (typeof f.checkValidity === 'function' && !f.checkValidity()) return;
    ev('contact_click', { method: 'form_submit', position: 'contact' });
  }, true);

  /* Calendar-aware copy: elements with data-cal-text show that text once a calendar link is configured. */
  function calCopy() {
    var C = window.JQ_BOOKING || {};
    if (!C.googleSchedule) return;
    document.querySelectorAll('[data-cal-text]').forEach(function (el) { el.textContent = el.getAttribute('data-cal-text'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', calCopy); else calCopy();
})();
