/**
 * Вариант А «Ночное путешествие»: анимации.
 * Контент рендерит shared/render.js, звёзды — starfield.js.
 */
(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');

  window.renderCourse();
  if (window.FX) {
    FX.progress();
    FX.marquee(window.COURSE.block2.items.map(function (i) { return i.stop; }));
    if (!reduced) FX.tilt('.m-card, .f-card', 6);
  }

  if (!window.gsap) { document.documentElement.classList.add('reduced'); return; }
  gsap.registerPlugin(ScrollTrigger);

  if (!reduced && window.Lenis) {
    var lenis = new Lenis({ lerp: .08 }); // тяжёлый, «киношный» скролл
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Титры: оркестрованное открытие hero ---------- */
  if (!reduced) {
    var h1 = document.querySelector('.hero h1');
    var words = window.FX ? FX.splitWords(h1) : [];
    gsap.set(words, { yPercent: 115 });
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo('.hero-inner', { scale: 1.045 }, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
      .fromTo('.hero .eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, .2)
      .to(words, { yPercent: 0, duration: 1.3, stagger: .085 }, .45)
      .set(h1, { opacity: 1 }, .45)
      .fromTo('.hero-lead', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.2 }, 1.25)
      .fromTo('.hero .hero-cta', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.2 }, 1.5)
      .fromTo('.scroll-hint', { opacity: 0 }, { opacity: 1, duration: 1 }, 2);

    // камера «уходит вверх», когда зритель покидает сцену hero
    gsap.to('.hero-inner', {
      yPercent: -16, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: .4 }
    });
    // луна отстаёт от скролла — глубина кадра
    gsap.to('#moon', {
      yPercent: 60, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .3 }
    });

    // рассвет проявляется у финального CTA — конец ночного пути
    gsap.to('#dawn', {
      opacity: .85, ease: 'none',
      scrollTrigger: { trigger: '.final', start: 'top 85%', end: 'bottom bottom', scrub: .5 }
    });
  }

  /* ---------- Reveal ---------- */
  if (!reduced) {
    document.querySelectorAll('[data-reveal]').forEach(function (node) {
      if (node.closest('.hero')) return; // hero открывают титры выше
      gsap.fromTo(node,
        { opacity: 0, y: 36, scale: .985 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1.25, ease: 'power4.out',
          scrollTrigger: { trigger: node, start: 'top 88%', once: true }
        });
    });

    document.querySelectorAll('.stop').forEach(function (stop) {
      var fromX = stop.classList.contains('right') ? 46 : -46;
      gsap.fromTo(stop.querySelector('.stop-card'),
        { opacity: 0, x: fromX },
        {
          opacity: 1, x: 0, duration: 1.15, ease: 'power4.out',
          scrollTrigger: { trigger: stop, start: 'top 78%', once: true }
        });
      gsap.fromTo(stop.querySelector('.marker'),
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: .9, ease: 'back.out(1.9)',
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

  /* ---------- Золотая тропа ---------- */
  var trail = document.getElementById('trail');
  var svg = document.getElementById('trailSvg');
  var base = document.getElementById('trailBase');
  var goldPath = document.getElementById('trailGold');
  var comet = document.getElementById('comet');
  var drawST = null;
  var trailLen = 0;
  var drawTarget = 0;  // прогресс скролла (цель)
  var drawShown = 0;   // прорисованный прогресс — плавно догоняет цель

  function buildTrail() {
    var rect = trail.getBoundingClientRect();
    var w = trail.clientWidth, h = trail.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    var pts = [{ x: w / 2, y: 8 }];
    trail.querySelectorAll('.marker').forEach(function (m) {
      var r = m.getBoundingClientRect();
      pts.push({ x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 });
    });
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
    goldPath.setAttribute('d', d);

    trailLen = goldPath.getTotalLength();
    goldPath.style.strokeDasharray = trailLen;

    if (reduced) { goldPath.style.strokeDashoffset = 0; return; }

    // при перестройке (resize/refresh) сохраняем уже прорисованную долю
    goldPath.style.strokeDashoffset = trailLen * (1 - drawShown);
    if (drawST) drawST.kill();
    drawST = ScrollTrigger.create({
      trigger: trail, start: 'top 78%', end: 'bottom 80%',
      onUpdate: function (self) { drawTarget = self.progress; }
    });
    drawTarget = drawST.progress;
  }

  function drawFrame() {
    // линия догоняет скролл через lerp — без рывков даже при резком скролле
    var k = 1 - Math.pow(.945, gsap.ticker.deltaRatio());
    drawShown += (drawTarget - drawShown) * k;
    if (Math.abs(drawTarget - drawShown) < .0004) drawShown = drawTarget;

    goldPath.style.strokeDashoffset = trailLen * (1 - drawShown);
    var p = goldPath.getPointAtLength(trailLen * drawShown);
    comet.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
    comet.style.opacity = drawShown > .003 && drawShown < .997 ? 1 : 0;
  }

  buildTrail();
  ScrollTrigger.addEventListener('refreshInit', buildTrail);
  if (!reduced) gsap.ticker.add(drawFrame);

  var resizeT;
  addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
  }, { passive: true });
})();
