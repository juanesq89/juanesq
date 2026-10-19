/* juanesq.com — home/about/guides UI: sticky nav state, mobile menu, scroll sequence, reveal-on-scroll, mobile CTA bar. No dependencies. */
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
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* pinned typographic sequence (.seq[data-seq]): writes --p (0..1) while the section scrolls past; CSS does the rest.
     Without JS or with reduced motion it stays a static heading. */
  var seqs = d.querySelectorAll('[data-seq]');
  if (seqs.length && !reduced && 'requestAnimationFrame' in window) {
    var ticking = false;
    var seqUpd = function () {
      ticking = false;
      for (var i = 0; i < seqs.length; i++) {
        var r = seqs[i].getBoundingClientRect(), span = r.height - window.innerHeight;
        var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
        seqs[i].style.setProperty('--p', p.toFixed(4));
      }
    };
    for (var k = 0; k < seqs.length; k++) seqs[k].classList.add('is-live');
    seqUpd();
    var seqReq = function () { if (!ticking) { ticking = true; requestAnimationFrame(seqUpd); } };
    window.addEventListener('scroll', seqReq, { passive: true });
    window.addEventListener('resize', seqReq);
  }
  /* reveal (practice lines get a stagger index) */
  var rows = d.querySelectorAll(".lines .line");
  for (var j = 0; j < rows.length; j++) rows[j].style.setProperty('--i', j % 5);
  var els = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }
  /* about: matters list rolls upward without stopping (the whole list is cloned once so it loops); CSS pauses it on hover */
  var am = d.getElementById('am-list');
  if (am && !reduced && am.children.length > 5) {
    var n = am.children.length;
    for (var q = 0; q < n; q++) { var cl = am.children[q].cloneNode(true); cl.setAttribute('aria-hidden', 'true'); am.appendChild(cl); }
    am.parentNode.style.setProperty('--n', n);
    am.parentNode.classList.add('is-live');
  }
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
