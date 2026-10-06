/* Mansilla Garzón & Asociados — interacciones del sitio (sin librerías externas) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Recordar que el telón ya se mostró en esta visita
  try { sessionStorage.setItem('mg-seen', '1'); } catch (e) {}

  /* Navegación: fondo al bajar, se oculta al bajar rápido y vuelve al subir */
  var nav = doc.querySelector('.nav');
  var progress = doc.querySelector('.progress');
  var heroMedia = doc.querySelector('.hero-media');
  var heroInner = doc.querySelector('.hero-inner');
  var wa = doc.querySelector('.wa');
  var lastY = 0, ticking = false;

  function onScroll() {
    var y = window.scrollY || 0;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    if (nav) {
      nav.classList.toggle('scrolled', y > 60);
      var menuOpen = doc.querySelector('.menu.open');
      nav.classList.toggle('hide', !menuOpen && y > 500 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove('hide');
    }
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (wa) wa.classList.toggle('show', y > 420);
    if (!reduce && y < window.innerHeight * 1.2) {
      if (heroMedia) heroMedia.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0)';
      if (heroInner) heroInner.style.opacity = String(Math.max(1 - y / (window.innerHeight * 0.85), 0));
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Menú móvil */
  var burger = doc.querySelector('.burger');
  var menu = doc.querySelector('.menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Aparición al hacer scroll, con escalonado entre hermanos */
  var targets = [].slice.call(doc.querySelectorAll('[data-reveal]'));
  doc.querySelectorAll('[data-stagger]').forEach(function (group) {
    [].slice.call(group.children).forEach(function (el, i) {
      el.style.setProperty('--rd', (i * 0.09).toFixed(2) + 's');
    });
  });
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Contadores */
  function count(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end) || reduce) return;
    var start = null, dur = 1700;
    el.textContent = '0';
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = [].slice.call(doc.querySelectorAll('[data-count]'));
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; cio.unobserve(el);
        var wait = el.closest('.hero') && !root.classList.contains('seen') ? 2300 : 250;
        setTimeout(function () { count(el); }, wait);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Transición entre páginas */
  var veil = doc.querySelector('.veil');
  doc.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !veil || reduce) return;
    var href = a.getAttribute('href');
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (!/^[\w-]+\.html([?#].*)?$/.test(href)) return;
    var samePage = href.split(/[?#]/)[0] === (location.pathname.split('/').pop() || 'index.html');
    if (samePage && href.indexOf('#') > -1) return;
    e.preventDefault();
    setMenu(false);
    veil.classList.add('on');
    setTimeout(function () { location.href = href; }, 330);
  });
  window.addEventListener('pageshow', function () { if (veil) veil.classList.remove('on'); });

  /* Año del pie */
  var yr = doc.querySelector('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* Formulario de contacto: arma el mensaje y lo abre en WhatsApp o en el correo */
  var form = doc.querySelector('#consulta');
  if (form) {
    var note = doc.querySelector('#consulta-nota');
    var area = form.querySelector('#f-area');
    var m = /[?&]area=([^&#]+)/.exec(location.search);
    if (m && area) {
      var wanted = decodeURIComponent(m[1]);
      [].slice.call(area.options).forEach(function (o) { if (o.value === wanted) area.value = wanted; });
    }
    function message() {
      var v = function (id) { var el = form.querySelector('#' + id); return el ? el.value.trim() : ''; };
      var lines = ['Hola, quiero hacer una consulta.', '',
        'Nombre: ' + v('f-nombre') + ' ' + v('f-apellido')];
      if (v('f-email')) lines.push('Email: ' + v('f-email'));
      if (v('f-tel')) lines.push('Teléfono: ' + v('f-tel'));
      if (v('f-area')) lines.push('Área: ' + v('f-area'));
      lines.push('', v('f-mensaje'));
      return lines.join('\n');
    }
    function open(url) {
      var a = doc.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      doc.body.appendChild(a); a.click(); a.remove();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var via = (e.submitter && e.submitter.value) || 'whatsapp';
      var text = encodeURIComponent(message());
      if (via === 'email') {
        open('mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent('Consulta desde la web') + '&body=' + text);
        if (note) note.textContent = 'Se abrió tu correo con la consulta lista. Falta enviarla desde ahí.';
      } else {
        open('https://wa.me/' + form.getAttribute('data-wa') + '?text=' + text);
        if (note) note.textContent = 'Se abrió WhatsApp con la consulta lista. Falta enviarla desde ahí.';
      }
    });
  }
})();
