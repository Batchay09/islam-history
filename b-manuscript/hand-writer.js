/**
 * Перо реально пишет заголовки свитка (вариант Б «Манускрипт»).
 *
 * Данные букв — hand-data.js (SVG-пути глифов шрифта Caveat,
 * сгенерированы tools/handwriting/generate.js). Когда остановка
 * появляется на экране, перо перелетает к её заголовку, выводит
 * буквы (прорисовка штриха + заливка), свежие чернила высыхают,
 * затем перо возвращается на линию летописи.
 *
 * Связь с app.js: пока идёт письмо, window.__quillLock = true —
 * скролл-логика линии не трогает перо, но кладёт свою актуальную
 * точку в window.__trailQuill (туда перо и возвращается).
 */
(function () {
  'use strict';

  var SPEED = 3200;                   // единиц пути в секунду — живое быстрое письмо
  var CHAR_MIN = .03, CHAR_MAX = .09; // длительность одной буквы, с
  var WET = '#150B01';               // свежие чернила; высыхают до цвета текста (CSS-transition)
  var NS = 'http://www.w3.org/2000/svg';

  var quill = null, trail = null;
  var queue = [], writing = false, releasing = false;
  var lastPos = null; // последняя позиция острия в координатах #trail

  /* ---------- Подготовка: заголовок → скрытый текст + SVG-буквы ---------- */
  function prepare(h3, data) {
    var D = window.HAND_TITLES;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hand-title');
    svg.setAttribute('viewBox', data.vb.join(' '));
    svg.setAttribute('aria-hidden', 'true');

    var items = data.chars.map(function (c) {
      if (c.g) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', D.glyphs[c.g]);
        p.setAttribute('transform', 'translate(' + c.x + ' 0)');
        svg.appendChild(p);
        return { el: p, path: true };
      }
      // символ без глифа в шрифте (ﷺ) — обычный текст, проявится при письме
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', c.x);
      t.setAttribute('y', D.baseline);
      t.textContent = c.t;
      svg.appendChild(t);
      return { el: t, path: false };
    });

    var sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = h3.textContent;
    h3.textContent = '';
    h3.appendChild(sr);
    h3.appendChild(svg);

    items.forEach(function (it) {
      if (!it.path) return;
      it.len = it.el.getTotalLength();
      it.el.style.strokeDasharray = it.len;
      it.el.style.strokeDashoffset = it.len;
      it.el.style.color = WET;
    });
    return { svg: svg, items: items };
  }

  /* ---------- Геометрия: точка буквы → координаты #trail ---------- */
  function toTrail(el, p) {
    var m = el.getScreenCTM();
    var tr = trail.getBoundingClientRect();
    if (!m) return lastPos || { x: 0, y: 0 };
    return {
      x: m.a * p.x + m.c * p.y + m.e - tr.left,
      y: m.b * p.x + m.d * p.y + m.f - tr.top
    };
  }

  function moveQuill(x, y, rot) {
    quill.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
    lastPos = { x: x, y: y };
  }

  /* ---------- Перелёт пера по дуге к цели (цель пересчитывается на лету) ---------- */
  function flyTo(tl, getTarget, dur) {
    var from = null;
    var proxy = { t: 0 };
    tl.to(proxy, {
      t: 1, duration: dur, ease: 'power2.inOut',
      onStart: function () {
        var tgt = getTarget();
        from = lastPos || { x: tgt.x, y: tgt.y - 140 };
        quill.style.opacity = 1;
      },
      onUpdate: function () {
        var tgt = getTarget(), t = proxy.t;
        var x = from.x + (tgt.x - from.x) * t;
        var y = from.y + (tgt.y - from.y) * t - Math.sin(t * Math.PI) * 46;
        moveQuill(x, y, -6 - 16 * Math.sin(t * Math.PI));
      }
    });
  }

  /* ---------- Письмо одной буквы: штрих встык, заливка и высыхание — параллельно ---------- */
  function addChar(tl, it, at) {
    if (!it.path) {
      tl.to(it.el, { opacity: 1, duration: .25 }, at);
      return at + .08; // перо лишь слегка задерживается над fallback-символом
    }
    var dur = Math.max(CHAR_MIN, Math.min(CHAR_MAX, it.len / SPEED));
    tl.to(it.el, {
      strokeDashoffset: 0, duration: dur, ease: 'none',
      onUpdate: function () {
        var s = it.len * this.progress();
        var p = it.el.getPointAtLength(s);
        var a = it.el.getPointAtLength(Math.min(it.len, s + 2));
        var P = toTrail(it.el, p), A = toTrail(it.el, a);
        var ang = Math.atan2(A.y - P.y, A.x - P.x) * 180 / Math.PI;
        moveQuill(P.x, P.y, ang * .18 - 8 + Math.sin(s * .3) * 2.5);
      }
    }, at);
    // заливка не блокирует следующую букву — перо уже пишет дальше
    tl.to(it.el, { fillOpacity: 1, duration: .12 }, at + dur - .02);
    tl.call(function () { it.el.style.color = ''; }, null, at + dur + .3); // высыхание — CSS-transition
    return at + dur;
  }

  /* ---------- Мгновенное дописывание (карточка уже вне экрана) ---------- */
  function completeInstant(entry) {
    entry.items.forEach(function (it) {
      if (it.path) {
        it.el.style.strokeDashoffset = 0;
        it.el.style.fillOpacity = 1;
        it.el.style.color = '';
      } else {
        it.el.style.opacity = 1;
      }
    });
  }

  /* ---------- Очередь: перо одно, пишет по одному заголовку ---------- */
  function enqueue(entry) {
    queue.push(entry);
    pump();
  }

  function pump() {
    if (writing || releasing) return;
    var entry = queue.shift();
    if (!entry) return;

    var r = entry.svg.getBoundingClientRect();
    if (r.bottom < -60 || r.top > innerHeight + 60) {
      completeInstant(entry);
      pump();
      return;
    }

    writing = true;
    window.__quillLock = true;

    var firstPath = null;
    for (var i = 0; i < entry.items.length; i++) {
      if (entry.items[i].path) { firstPath = entry.items[i]; break; }
    }
    var tl = gsap.timeline({
      onComplete: function () {
        writing = false;
        if (queue.length) pump(); else release();
      }
    });
    var at = 0;
    if (firstPath) {
      var flightDur = lastPos ? .4 : .3;
      flyTo(tl, function () {
        return toTrail(firstPath.el, firstPath.el.getPointAtLength(0));
      }, flightDur);
      at = flightDur;
    }
    entry.items.forEach(function (it) { at = addChar(tl, it, at); });
    tl.timeScale(1 + queue.length); // очередь копится — перо пишет быстрее
  }

  /* ---------- Возврат пера на линию летописи ---------- */
  function release() {
    releasing = true;
    var proxy = { t: 0 };
    var from = lastPos;
    gsap.to(proxy, {
      t: 1, duration: .55, ease: 'power2.inOut',
      onUpdate: function () {
        var back = window.__trailQuill;
        if (!from || !back || !back.visible) return;
        var t = proxy.t;
        var x = from.x + (back.x - from.x) * t;
        var y = from.y + (back.y - from.y) * t - Math.sin(t * Math.PI) * 40;
        moveQuill(x, y, back.rot + (-6 - back.rot) * (1 - t));
      },
      onComplete: function () {
        var back = window.__trailQuill;
        if (!back || !back.visible) quill.style.opacity = 0;
        releasing = false;
        window.__quillLock = false;
        if (queue.length) pump();
      }
    });
  }

  /* ---------- Инициализация (вызывает app.js после рендера) ---------- */
  function init() {
    if (!window.gsap || !window.ScrollTrigger || !window.HAND_TITLES) return;
    if (document.documentElement.classList.contains('reduced')) return;
    quill = document.getElementById('quill');
    trail = document.getElementById('trail');
    if (!quill || !trail) return;

    document.querySelectorAll('.stop-card h3, .destination h3').forEach(function (h3) {
      var data = window.HAND_TITLES.titles[h3.textContent.trim()];
      if (!data) return;
      var entry = prepare(h3, data);
      ScrollTrigger.create({
        trigger: h3.closest('.stop') || h3.closest('.destination') || h3,
        start: 'top 80%', // писать сразу, как только карточка появляется
        once: true,
        onEnter: function () { enqueue(entry); }
      });
    });
  }

  window.HandWriter = { init: init };
})();
