/* juanesq.com — home/about UI: sticky nav state, mobile menu, reveal-on-scroll, mobile CTA bar. No dependencies. */
(function () {
  var d = document, nav = d.getElementById('navbar');
  if (nav) {
    var solid = nav.classList.contains('solid');
    var onScroll = function () { if (!solid) nav.classList.toggle('scrolled', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    var btn = nav.querySelector('.menu-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('.nav-links a, .nav-cta');
        if (a && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      });
    }
  }
  /* reveal */
  var els = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }
  /* mobile CTA bar: show once the hero CTAs are out of view, hide over the contact section */
  var bar = d.getElementById('floating-cta'), hero = d.querySelector('.hero-actions, .closing .hero-actions'), contact = d.getElementById('contact');
  if (bar && 'IntersectionObserver' in window) {
    var heroOut = !hero, contactIn = false;
    var upd = function () { bar.classList.toggle('show', heroOut && !contactIn); };
    if (hero) new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; upd(); }).observe(hero);
    if (contact) new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(contact);
    upd();
  } else if (bar) { bar.classList.add('show'); }
})();
