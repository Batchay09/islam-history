/**
 * Космос: спокойные звёзды — мерцание, медленный дрейф, параллакс от скролла.
 * Никакого «варпа»: движение плавное, созерцательное.
 * app.js может мягко поднимать яркость через window.__starGlow (1..1.3).
 */
(function () {
  'use strict';

  var canvas = document.getElementById('cosmos');
  if (!canvas) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var stars = [];
  var running = true;

  window.__starGlow = 1;

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    stars = [];
    var isMobile = W < 720;
    var count = Math.min(Math.floor(W * H / (isMobile ? 5200 : 3200)), 360);
    for (var i = 0; i < count; i++) {
      var depth = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: .3 + depth * 1.3,
        depth: depth,
        tw: Math.random() * Math.PI * 2,
        sp: .002 + Math.random() * .011,
        vx: (Math.random() - .5) * .05, // едва заметный дрейф
        warm: Math.random() < .14
      });
    }
  }

  var lastScroll = 0;
  var diveV = 0; // сглаженная скорость «падения»

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var glow = Math.max(1, Math.min(1.4, window.__starGlow || 1));
    var CX = W / 2, CY = H / 2;

    // погружение: постоянный медленный дрейф вглубь + ускорение от скролла
    var sc = window.scrollY || 0;
    var delta = sc - lastScroll;
    lastScroll = sc;
    diveV += (Math.max(-30, Math.min(30, delta)) * .045 - diveV) * .06;
    var dive = .14 + Math.abs(diveV); // базовое «падение» всегда чуть-чуть есть

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.tw += s.sp;
      // звёзды расходятся от центра — зритель летит сквозь них
      var dx = s.x - CX, dy = s.y - CY;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var v = dive * (.25 + s.depth) * (dist / (W * .5) + .25);
      s.x += dx / dist * v;
      s.y += dy / dist * v;
      if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) {
        // возрождение ближе к центру — глубина бесконечна
        s.x = CX + (Math.random() - .5) * W * .6;
        s.y = CY + (Math.random() - .5) * H * .6;
        s.depth = Math.random();
        s.r = .3 + s.depth * 1.3;
      }
      var a = (.28 + Math.abs(Math.sin(s.tw)) * .72) * (.4 + s.depth * .6) * glow;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = s.warm ? '#E8C766' : '#E9E4F2';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (glow > 1.05 ? glow * .9 : 1), 0, 6.283);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(frame);
  });

  requestAnimationFrame(frame); // при reduced — один статичный кадр
})();
