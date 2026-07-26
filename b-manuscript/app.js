/**
 * Вариант Б «Манускрипт»: лист пергамента на столе скриптория.
 * Язык движения — «перо пишет летопись»: буквица пропечатывается,
 * заголовок пишется по буквам, росчерк прорисовывается, разделители
 * рисуются, печати пропечатываются. Сам лист — физический предмет:
 * опускается на стол при загрузке, наклоняется за курсором/гироскопом
 * («держу в руках»), прогибается при скролле; край листа рваный.
 */
(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');

  /* Облегчённый профиль для телефонов (тач = нет мыши). Выключаем всё, что
     заставляет пересчитывать полный кадр при скролле: наклон листа (transform
     на элементе высотой в десятки тысяч пикселей), инерционный скролл Lenis
     со своей rAF-петлёй, частый рваный край. Письмо пера остаётся — оно
     и есть смысл страницы. */
  var light = matchMedia('(hover: none)').matches;

  window.renderCourse();
  if (window.FX) FX.progress();

  if (!window.gsap) { document.documentElement.classList.add('reduced'); return; }
  gsap.registerPlugin(ScrollTrigger);

  var sheet = document.getElementById('sheet');
  var scene = document.querySelector('.scene');
  var skin = document.getElementById('sheetSkin');
  var gloss = document.querySelector('.sheet-gloss');

  /* ---------- Наклон листа «в руках» + прогиб при скролле ---------- */
  var tilt = { rx: 0, ry: 0, txr: 0, tyr: 0, bend: 0, bendT: 0, ready: false };

  var lenis = null;
  if (!reduced && !light && window.Lenis) {
    lenis = new Lenis({ lerp: .08 }); // неторопливый «книжный» скролл
    lenis.on('scroll', function (e) {
      ScrollTrigger.update();
      // лист едва прогибается от скорости прокрутки, затем распрямляется
      if (e && typeof e.velocity === 'number') {
        tilt.bendT = Math.max(-1.3, Math.min(1.3, -e.velocity * .035));
      }
    });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Рваный край листа: полигон с «укусами» внутрь ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function roughEdges() {
    if (!skin) return;
    var w = skin.clientWidth, h = skin.clientHeight;
    if (!w || !h) return;
    var rnd = mulberry32(7);
    var pts = [];
    function edge(x0, y0, x1, y1, step) {
      var dx = x1 - x0, dy = y1 - y0;
      var len = Math.sqrt(dx * dx + dy * dy);
      var n = Math.max(2, Math.round(len / step));
      // нормаль внутрь листа (обход по часовой): (-dy, dx) / len
      var nx = -dy / len, ny = dx / len;
      for (var i = 0; i < n; i++) {
        var t = i / n;
        var deep = rnd() < .07 ? 6 + rnd() * 9 : 0; // редкий глубокий «укус»
        var a = rnd() * 4.5 + deep;
        pts.push([
          x0 + dx * t + nx * a,
          y0 + dy * t + ny * a
        ]);
      }
    }
    var stepX = light ? 64 : 26, stepY = light ? 260 : 120;
    edge(0, 0, w, 0, stepX);   // верх
    edge(w, 0, w, h, stepY);   // право
    edge(w, h, 0, h, stepX);   // низ
    edge(0, h, 0, 0, stepY);   // лево
    skin.style.clipPath = 'polygon(' + pts.map(function (p) {
      return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px';
    }).join(',') + ')';
  }

  function applySheet() {
    var oy = scrollY + innerHeight / 2 - sheet.offsetTop;
    sheet.style.transformOrigin = '50% ' + oy.toFixed(0) + 'px';
    scene.style.perspectiveOrigin = '50% ' + (scrollY + innerHeight / 2).toFixed(0) + 'px';
    sheet.style.transform =
      'rotateX(' + (tilt.ry + tilt.bend).toFixed(3) + 'deg) rotateY(' + tilt.rx.toFixed(3) + 'deg)';
  }

  if (!reduced && !light) {
    gsap.ticker.add(function () {
      tilt.rx += (tilt.txr - tilt.rx) * .06;
      tilt.ry += (tilt.tyr - tilt.ry) * .06;
      tilt.bend += (tilt.bendT - tilt.bend) * .1;
      tilt.bendT *= .92;
      if (tilt.ready) applySheet();
    });

    // курсор — на устройствах с мышью
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      addEventListener('mousemove', function (e) {
        var px = e.clientX / innerWidth - .5;
        var py = e.clientY / innerHeight - .5;
        tilt.txr = px * 2.4;
        tilt.tyr = -py * 1.7;
        if (gloss) {
          gloss.style.setProperty('--mx', (50 + px * 42).toFixed(1) + '%');
          gloss.style.setProperty('--my', (50 + py * 42).toFixed(1) + '%');
        }
      }, { passive: true });
    }

    // гироскопа здесь нет намеренно: наклон листа по датчику держал 3D-слой
    // размером во всю страницу и ронял кадры на слабых Android
  }

  /* ---------- Лист опускается на стол ---------- */
  if (!reduced && !light) {
    // точка схода перспективы — в центре первого экрана, а не в середине страницы
    scene.style.perspectiveOrigin = '50% ' + Math.round(innerHeight / 2) + 'px';
    gsap.fromTo(sheet,
      { y: -34, rotationX: 6, scale: 1.015, transformOrigin: '50% 10%', opacity: 0 },
      {
        y: 0, rotationX: 0, scale: 1, opacity: 1, duration: 1.15, ease: 'power3.out',
        onComplete: function () {
          gsap.set(sheet, { clearProps: 'transform,transformOrigin,opacity' });
          tilt.ready = true;
        }
      });
    gsap.fromTo('.sheet-shadow',
      { opacity: .2 }, { opacity: 1, duration: 1.15, ease: 'power3.out' });
    gsap.to('.thumb', { opacity: 1, duration: .9, delay: .8, stagger: .15 });
  } else if (!reduced) {
    // телефон: лист просто проявляется — без 3D-слоя на всю страницу
    gsap.fromTo(sheet, { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: .8, ease: 'power2.out',
        onComplete: function () { gsap.set(sheet, { clearProps: 'transform,opacity' }); } });
  }

  /* ---------- Титры hero: печать буквицы → письмо → росчерк → печать ---------- */
  if (!reduced) {
    var h1 = document.querySelector('.hero h1');
    var chars = window.FX ? FX.splitChars(h1) : [];
    gsap.set(chars, { opacity: 0 });
    gsap.timeline({ defaults: { ease: 'power2.out' }, delay: .55 })
      .fromTo('.hero .eyebrow', { opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)', duration: .9 }, .1)
      // буквица «пропечатывается» в кожу
      .fromTo('.drop-cap',
        { opacity: 0, scale: 1.6, rotate: -7 },
        { opacity: 1, scale: 1, rotate: 0, duration: .5, ease: 'power3.in' }, .5)
      .to('.drop-cap', { scale: .965, duration: .1, ease: 'power1.out' }, 1)
      .to('.drop-cap', { scale: 1, duration: .25, ease: 'back.out(3)' }, 1.1)
      .set('.cap-title', { opacity: 1 }, .5)
      // заголовок пишется по буквам
      .to(chars, {
        opacity: 1, duration: .3, stagger: .022,
        onStart: function () { h1.style.opacity = 1; }
      }, 1.15)
      // росчерк пера под заголовком
      .to('#flourishPath', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 2.3)
      .fromTo('.hero-lead', { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1 }, 2.7)
      // сургучная печать шлёпается в лист
      .set('.hero .hero-cta', { opacity: 1 }, 2.95)
      .fromTo('.hero .cta-seal',
        { opacity: 0, scale: 1.7, rotate: -14 },
        { opacity: 1, scale: 1, rotate: -4, duration: .38, ease: 'power3.in' }, 3)
      .to('.hero .cta-seal', { scale: .94, duration: .09, ease: 'power1.out' }, 3.38)
      .to('.hero .cta-seal', { scale: 1, duration: .3, ease: 'back.out(2.6)' }, 3.47)
      // inline-transform от GSAP перебил бы :hover — отдаём печать обратно CSS
      .set('.hero .cta-seal', { clearProps: 'transform' }, 3.8)
      .fromTo('.hero .date-chip', { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)', duration: .8 }, 3.5)
      .fromTo('.scroll-hint', { opacity: 0 }, { opacity: 1, duration: .9 }, 3.9);

    gsap.to('.hero-inner', {
      yPercent: -10, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 40%', scrub: .4 }
    });
  }

  /* ---------- Появления: только «чернила проступают», ничего не выезжает ---------- */
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
        // чернила впитываются в кожу; сетки — с лёгкой очерёдностью письма
        var delay = 0;
        if (node.matches('.m-card, .f-card, .stat, .format-list li')) {
          delay = Array.prototype.indexOf.call(node.parentElement.children, node) * .08;
        }
        gsap.fromTo(node,
          { opacity: 0, filter: 'blur(6px)' },
          {
            opacity: 1, filter: 'blur(0px)', duration: 1.2, delay: delay, ease: 'power2.out',
            scrollTrigger: { trigger: node, start: 'top 88%', once: true }
          });
      }
    });

    // мини-печати с номерами пропечатываются в карточки
    document.querySelectorAll('.m-card .idx').forEach(function (idx) {
      gsap.fromTo(idx,
        { scale: 1.8, opacity: 0, rotate: -10 },
        {
          scale: 1, opacity: 1, rotate: 0, duration: .45, ease: 'power3.in',
          scrollTrigger: { trigger: idx.closest('.m-card'), start: 'top 86%', once: true }
        });
    });

    // разделители-орнаменты прорисовываются пером
    document.querySelectorAll('.divider').forEach(function (div) {
      var paths = div.querySelectorAll('path');
      paths.forEach(function (p) {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L;
        p.style.strokeDashoffset = L;
      });
      var dot = div.querySelector('circle');
      var tl = gsap.timeline({
        scrollTrigger: { trigger: div, start: 'top 92%', once: true }
      });
      tl.to(paths, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .18 });
      if (dot) tl.fromTo(dot, { attr: { r: 0 } }, { attr: { r: 1.6 }, duration: .3, ease: 'back.out(3)' }, '-=.2');
    });

    // печать финального CTA пропечатывается
    document.querySelectorAll('.final .cta-seal').forEach(function (seal) {
      gsap.timeline({
        scrollTrigger: { trigger: seal, start: 'top 88%', once: true }
      })
        .fromTo(seal, { opacity: 0, scale: 1.7, rotate: -14 },
          { opacity: 1, scale: 1, rotate: -4, duration: .38, ease: 'power3.in' })
        .to(seal, { scale: .94, duration: .09, ease: 'power1.out' })
        .to(seal, { scale: 1, duration: .3, ease: 'back.out(2.6)' })
        .set(seal, { clearProps: 'transform' });
    });

    // главы летописи
    document.querySelectorAll('.stop').forEach(function (stop) {
      gsap.fromTo(stop.querySelector('.stop-card'),
        { opacity: 0, filter: 'blur(5px)' },
        {
          opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out',
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

    // звезда финала летописи пропечатывается
    var star = document.querySelector('.dest-star');
    if (star) {
      gsap.fromTo(star,
        { scale: 1.6, opacity: 0, rotate: -12 },
        {
          scale: 1, opacity: 1, rotate: 0, duration: .5, ease: 'power3.in',
          scrollTrigger: { trigger: '.destination', start: 'top 80%', once: true }
        });
    }
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

  /* ---------- Линия летописи: её ведёт перо ----------
     Раньше линия была жёстко привязана к скроллу: остановил палец — остановилось
     перо, дёрнул страницу — линия прыгнула. Теперь скролл только назначает цель,
     а перо идёт к ней само, с постоянной скоростью руки, и на цели ждёт.
     Накопился долг (читатель ушёл вперёд) — перо дописывает быстрее, как человек,
     торопящийся догнать строку. Назад линия не стирается. */
  var trail = document.getElementById('trail');
  var svg = document.getElementById('trailSvg');
  var base = document.getElementById('trailBase');
  var inkPath = document.getElementById('trailGold');
  var wetPath = document.getElementById('trailWet');
  var drop = document.getElementById('comet');
  var quill = document.getElementById('quill');
  var WET = 150;         // длина «мокрого» следа за пером, px
  var HAND_SPEED = 520;  // скорость письма, px/с — темп неспешной руки
  var pen = { s: 0, goal: 0, len: 0 }; // где остриё и куда ведём линию

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

    inkPath.style.strokeDashoffset = Math.max(0, len - pen.s);
    wetPath.style.strokeDasharray = WET + ' ' + len;
    pen.len = len;
  }

  /* Писец: кадр за кадром ведёт остриё к цели, которую назначил скролл. */
  function penFrame(time, delta) {
    var len = pen.len;
    if (!len || pen.s >= pen.goal) return;

    var debt = pen.goal - pen.s;
    // долг больше экрана — читатель ушёл вперёд, перо дописывает быстрее
    var speed = HAND_SPEED * (1 + Math.min(3, debt / 900));
    pen.s = Math.min(pen.goal, pen.s + speed * delta / 1000);

    var s = pen.s;
    var p = inkPath.getPointAtLength(s);
    var ahead = inkPath.getPointAtLength(Math.min(len, s + 2));
    var angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180 / Math.PI;
    // рука не идёт по линейке: перо покачивается и «скребёт» кожу
    var wobble = Math.sin(s * .16) * 3.4 + Math.sin(s * .53) * 1.6;
    var press = Math.abs(Math.sin(s * .09)) * 1.6;
    var writing = pen.s < pen.goal;

    inkPath.style.strokeDashoffset = len - s;
    // нажим: рука то давит на перо, то отпускает — линия дышит толщиной
    inkPath.style.strokeWidth = (1.75 + Math.abs(Math.sin(s * .021)) * .7).toFixed(2);
    wetPath.style.strokeDashoffset = WET - s;
    wetPath.style.opacity = writing ? .8 : 0;

    var rot = angle * .18 - 38 + wobble * .7; // круто вверх — перо не ложится на текст
    window.__trailQuill = { x: p.x, y: p.y + press, rot: rot, visible: s > 0 };
    if (!window.__quillLock) {
      quill.style.transform =
        'translate(' + p.x + 'px,' + (p.y + press) + 'px) rotate(' + rot + 'deg)';
      quill.style.opacity = s > 0 && s < len ? 1 : 0;
    }
    drop.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
    drop.style.opacity = writing ? 1 : 0;
    sheet.style.setProperty('--rollx', (s / len * 160).toFixed(1) + 'px');
  }

  // перо-писец: заголовки превращаются в рукописные до замера линии,
  // чтобы buildTrail считал уже финальную вёрстку
  if (window.HandWriter) HandWriter.init();

  roughEdges();
  buildTrail();
  ScrollTrigger.addEventListener('refreshInit', function () {
    roughEdges();
    buildTrail();
  });

  if (!reduced) {
    gsap.ticker.add(penFrame);
    // Скролл только назначает цель — писать успевает само перо.
    // Один триггер на всю летопись: создавать их внутри refreshInit нельзя,
    // на пересчёте это глушило остальные триггеры страницы.
    ScrollTrigger.create({
      trigger: trail,
      start: 'top 78%',
      end: 'bottom 55%',
      onUpdate: function (self) {
        pen.goal = Math.max(pen.goal, self.progress * pen.len);
      }
    });
  }

  /* Пересчёт координат триггеров.
     Рукописные заголовки заменяют двухстрочный текст на SVG в 2.1em, и каждая
     остановка становится ниже на ~80 px. Одного refresh мало: пока не применён
     EB Garamond, em считается по подменному шрифту, и главы ниже первой
     срабатывали по старым позициям — то есть не срабатывали вообще. Поэтому
     пересчитываем и на следующем кадре, и после load, и с запасом по времени. */
  function settle() { ScrollTrigger.refresh(); }
  requestAnimationFrame(settle);
  addEventListener('load', settle);
  setTimeout(settle, 1200);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);

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
