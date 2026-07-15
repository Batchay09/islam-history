/**
 * Вариант Б «Манускрипт»: язык движения — «перо пишет летопись».
 * Буквица пропечатывается, заголовок пишется по буквам, росчерк
 * прорисовывается; заголовки секций «выписываются» слева направо;
 * линию летописи ведёт перо, наклоняющееся по ходу письма;
 * секции входят как перелистываемые страницы.
 */
(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');

  window.renderCourse();
  if (window.FX) FX.progress();

  if (!window.gsap) { document.documentElement.classList.add('reduced'); return; }
  gsap.registerPlugin(ScrollTrigger);

  if (!reduced && window.Lenis) {
    var lenis = new Lenis({ lerp: .08 }); // неторопливый «книжный» скролл
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Титры hero: печать буквицы → письмо → росчерк ---------- */
  if (!reduced) {
    var h1 = document.querySelector('.hero h1');
    var chars = window.FX ? FX.splitChars(h1) : [];
    gsap.set(chars, { opacity: 0 });
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .fromTo('.hero .eyebrow', { opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)', duration: .9 }, .1)
      // буквица «пропечатывается» в бумагу
      .fromTo('.drop-cap',
        { opacity: 0, scale: 1.6, rotate: -7 },
        { opacity: 1, scale: 1, rotate: 0, duration: .5, ease: 'power3.in' }, .5)
      .to('.drop-cap', { scale: .965, duration: .1, ease: 'power1.out' }, 1)
      .to('.drop-cap', { scale: 1, duration: .25, ease: 'back.out(3)' }, 1.1)
      .set('.cap-title', { opacity: 1 }, .5)
      // заголовок пишется по буквам, с лёгким «чернильным» размытием
      .to(chars, {
        opacity: 1, duration: .3, stagger: .022,
        onStart: function () { h1.style.opacity = 1; }
      }, 1.15)
      // росчерк пера под заголовком
      .to('#flourishPath', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 2.3)
      .fromTo('.hero-lead', { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1 }, 2.7)
      .fromTo('.hero .hero-cta', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .9 }, 3)
      .fromTo('.scroll-hint', { opacity: 0 }, { opacity: 1, duration: .9 }, 3.4);

    gsap.to('.hero-inner', {
      yPercent: -10, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 40%', scrub: .4 }
    });
  }

  /* ---------- Reveal: заголовки «выписываются», текст проступает ---------- */
  if (!reduced) {
    document.querySelectorAll('[data-reveal]').forEach(function (node) {
      if (node.closest('.hero')) return;
      if (node.tagName === 'H2') {
        // письмо слева направо
        gsap.fromTo(node,
          { opacity: 1, clipPath: 'inset(-8% 100% -12% 0)' },
          {
            clipPath: 'inset(-8% -2% -12% 0)', duration: 1.5, ease: 'power2.inOut',
            scrollTrigger: { trigger: node, start: 'top 86%', once: true }
          });
      } else {
        // чернила проступают на бумаге
        gsap.fromTo(node,
          { opacity: 0, y: 14, filter: 'blur(5px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'power2.out',
            scrollTrigger: { trigger: node, start: 'top 88%', once: true }
          });
      }
    });

    // секции — перелистываемые страницы (кроме hero и журнала с пером)
    document.querySelectorAll('.about, .method, .format, .features, .audience, .final').forEach(function (sec) {
      gsap.fromTo(sec,
        { rotationX: 5, y: 44, transformOrigin: 'center top' },
        {
          rotationX: 0, y: 0, duration: 1.4, ease: 'power3.out',
          scrollTrigger: { trigger: sec, start: 'top 84%', once: true }
        });
    });

    document.querySelectorAll('.stop').forEach(function (stop) {
      gsap.fromTo(stop.querySelector('.stop-card'),
        { opacity: 0, y: 18, filter: 'blur(5px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: stop, start: 'top 78%', once: true }
        });
      gsap.fromTo(stop.querySelector('.marker'),
        { scale: 1.7, opacity: 0, rotate: -10 },
        {
          scale: 1, opacity: 1, rotate: 0, duration: .5, ease: 'power3.in',
          scrollTrigger: { trigger: stop, start: 'top 78%', once: true }
        });
      ScrollTrigger.create({
        trigger: stop, start: 'top 65%', end: 'bottom 35%',
        onToggle: function (self) { stop.classList.toggle('is-active', self.isActive); }
      });
    });
  } else {
    document.querySelectorAll('.stop-card, .marker').forEach(function (n) { n.style.opacity = 1; });
  }

  /* ---------- Счётчики ---------- */
  document.querySelectorAll('.stat-num').forEach(function (numEl) {
    var target = parseFloat(numEl.dataset.target);
    var isFloat = target % 1 !== 0;
    function fmt(v) { return isFloat ? v.toFixed(1).replace('.', ',') : String(Math.round(v)); }
    if (reduced) { numEl.textContent = fmt(target); return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: function () { numEl.textContent = fmt(obj.v); },
      scrollTrigger: { trigger: numEl, start: 'top 85%', once: true }
    });
  });

  /* ---------- Линия летописи: её ведёт перо ---------- */
  var trail = document.getElementById('trail');
  var svg = document.getElementById('trailSvg');
  var base = document.getElementById('trailBase');
  var inkPath = document.getElementById('trailGold');
  var wetPath = document.getElementById('trailWet');
  var drop = document.getElementById('comet');
  var quill = document.getElementById('quill');
  var drawTween = null;
  var WET = 150; // длина «мокрого» следа за пером, px

  function buildTrail() {
    var rect = trail.getBoundingClientRect();
    var w = trail.clientWidth, h = trail.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    var markers = trail.querySelectorAll('.marker');
    var pts = [];
    markers.forEach(function (m) {
      var r = m.getBoundingClientRect();
      pts.push({ x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 });
    });
    // старт линии — над первым медальоном свитка
    if (pts.length) pts.unshift({ x: pts[0].x, y: 30 });
    var star = document.querySelector('.dest-star');
    if (star) {
      var sr = star.getBoundingClientRect();
      pts.push({ x: sr.left - rect.left + sr.width / 2, y: sr.top - rect.top + sr.height / 2 });
    }

    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i];
      var midY = (p0.y + p1.y) / 2;
      d += ' C ' + p0.x + ' ' + midY + ', ' + p1.x + ' ' + midY + ', ' + p1.x + ' ' + p1.y;
    }
    base.setAttribute('d', d);
    inkPath.setAttribute('d', d);
    wetPath.setAttribute('d', d);

    var len = inkPath.getTotalLength();
    inkPath.style.strokeDasharray = len;

    if (reduced) { inkPath.style.strokeDashoffset = 0; return; }

    inkPath.style.strokeDashoffset = len;
    wetPath.style.strokeDasharray = WET + ' ' + len;
    if (drawTween) { drawTween.scrollTrigger && drawTween.scrollTrigger.kill(); drawTween.kill(); }
    drawTween = gsap.to(inkPath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: trail, start: 'top 62%', end: 'bottom 88%', scrub: .5 },
      onUpdate: function () {
        var prog = this.progress();
        var s = len * prog;
        var p = inkPath.getPointAtLength(s);
        var ahead = inkPath.getPointAtLength(Math.min(len, s + 2));
        var angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180 / Math.PI;
        var visible = prog > 0 && prog < 1 ? 1 : 0;
        // живое письмо: перо покачивается и чуть «скребёт» бумагу
        var wobble = Math.sin(s * .16) * 3.4 + Math.sin(s * .53) * 1.6;
        var press = Math.abs(Math.sin(s * .09)) * 1.6;
        // актуальная точка линии — сюда перо возвращается после письма заголовков
        window.__trailQuill = { x: p.x, y: p.y + press, rot: angle * .22 - 10 + wobble, visible: !!visible };
        if (!window.__quillLock) {
          quill.style.transform =
            'translate(' + p.x + 'px,' + (p.y + press) + 'px) rotate(' + (angle * .22 - 10 + wobble) + 'deg)';
          quill.style.opacity = visible;
        }
        // мокрый след: тёмный сегмент сразу за пером, впереди — подсыхает
        wetPath.style.strokeDashoffset = WET - s;
        wetPath.style.opacity = visible * .8;
        drop.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
        drop.style.opacity = visible;
      }
    });
  }

  // перо-писец: заголовки превращаются в рукописные до замера линии,
  // чтобы buildTrail считал уже финальную вёрстку
  if (window.HandWriter) HandWriter.init();

  buildTrail();
  ScrollTrigger.addEventListener('refreshInit', buildTrail);

  /* ---------- Свеча следует за курсором ---------- */
  var candle = document.querySelector('.candle');
  if (candle) {
    var cx = innerWidth / 2, cy = innerHeight / 2;
    candle.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    if (!reduced && matchMedia('(hover:hover)').matches) {
      var tx = cx, ty = cy;
      addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
      gsap.ticker.add(function () {
        cx += (tx - cx) * .05;
        cy += (ty - cy) * .05;
        candle.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      });
    }
  }

  var resizeT;
  addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
  }, { passive: true });
})();
