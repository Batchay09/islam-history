/**
 * Звёздное небо: мерцание, параллакс от мыши и скролла, падающие звёзды.
 * Экономно: пауза при скрытой вкладке, ограничение DPR, passive-слушатели.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('stars');
  if (!canvas) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var stars = [];
  var meteors = [];
  var mouseX = 0, mouseY = 0;   // -1..1 от центра
  var running = true;
  var lastMeteor = 0;
  var t = 0;

  // Живые «ленты» северного сияния над горизонтом — эффект видео-фона
  var RIBBONS = [
    { baseY: .78, amp: 26, k: .0016, speed: .00045, h: 130, color: [232, 199, 102], a: .10 },
    { baseY: .84, amp: 34, k: .0011, speed: .00032, h: 170, color: [94, 120, 200], a: .12 },
    { baseY: .90, amp: 22, k: .0021, speed: .00058, h: 120, color: [140, 100, 190], a: .09 },
    { baseY: .72, amp: 40, k: .0008, speed: .00024, h: 200, color: [201, 162, 39], a: .06 }
  ];

  function drawRibbons(now) {
    ctx.globalCompositeOperation = 'lighter';
    for (var r = 0; r < RIBBONS.length; r++) {
      var rb = RIBBONS[r];
      var baseY = H * rb.baseY;
      var grad = ctx.createLinearGradient(0, baseY - rb.h, 0, baseY + rb.h * .4);
      grad.addColorStop(0, 'rgba(' + rb.color + ',0)');
      grad.addColorStop(.55, 'rgba(' + rb.color + ',' + rb.a + ')');
      grad.addColorStop(1, 'rgba(' + rb.color + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, baseY + rb.h * .4);
      for (var x = 0; x <= W; x += 16) {
        var y = baseY
          + Math.sin(x * rb.k + now * rb.speed) * rb.amp
          + Math.sin(x * rb.k * 2.7 + now * rb.speed * 1.6) * rb.amp * .4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, baseY + rb.h * .4);
      ctx.closePath();
      ctx.fill();
      // светящаяся верхняя кромка ленты
      ctx.strokeStyle = 'rgba(' + rb.color + ',' + (rb.a * 1.7) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (var x2 = 0; x2 <= W; x2 += 16) {
        var y2 = baseY
          + Math.sin(x2 * rb.k + now * rb.speed) * rb.amp
          + Math.sin(x2 * rb.k * 2.7 + now * rb.speed * 1.6) * rb.amp * .4;
        if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function resize() {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    stars = [];
    var count = Math.min(Math.floor(W * H / 3400), 340);
    for (var i = 0; i < count; i++) {
      var depth = Math.random();               // 0 — далеко, 1 — близко
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: .3 + depth * 1.25,
        depth: depth,
        tw: Math.random() * Math.PI * 2,
        sp: .003 + Math.random() * .014,
        warm: Math.random() < .16              // редкие золотые звёзды
      });
    }
  }

  function spawnMeteor(now) {
    lastMeteor = now;
    meteors.push({
      x: W * (.15 + Math.random() * .7),
      y: H * Math.random() * .3,
      vx: -(3 + Math.random() * 3),
      vy: 2 + Math.random() * 2,
      life: 1
    });
  }

  function frame(now) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    // сияние рисуем только пока виден первый экран (экономия на длинной странице)
    if ((window.scrollY || 0) < H * 1.3) drawRibbons(now || 0);

    var scrollShift = (window.scrollY || 0);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.tw += s.sp;
      // параллакс: близкие звёзды двигаются сильнее
      var px = s.x + mouseX * s.depth * 22;
      var py = (s.y - scrollShift * s.depth * .12) % H;
      if (py < 0) py += H;
      var a = .3 + Math.abs(Math.sin(s.tw)) * .7;
      ctx.globalAlpha = a * (.45 + s.depth * .55);
      ctx.fillStyle = s.warm ? '#E8C766' : '#EDE6D0';
      ctx.beginPath();
      ctx.arc(px, py + mouseY * s.depth * 12, s.r, 0, 6.283);
      ctx.fill();
    }

    if (!reduced) {
      if (now - lastMeteor > 5000 + Math.random() * 4000 && meteors.length < 2) spawnMeteor(now);
      for (var m = meteors.length - 1; m >= 0; m--) {
        var mt = meteors[m];
        mt.x += mt.vx; mt.y += mt.vy; mt.life -= .014;
        if (mt.life <= 0) { meteors.splice(m, 1); continue; }
        var grad = ctx.createLinearGradient(mt.x, mt.y, mt.x - mt.vx * 14, mt.y - mt.vy * 14);
        grad.addColorStop(0, 'rgba(244,232,190,' + (.8 * mt.life) + ')');
        grad.addColorStop(1, 'rgba(244,232,190,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(mt.x, mt.y);
        ctx.lineTo(mt.x - mt.vx * 14, mt.y - mt.vy * 14);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize, { passive: true });
  addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / W - .5) * 2;
    mouseY = (e.clientY / H - .5) * 2;
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(frame);
  });

  requestAnimationFrame(frame); // при reduced нарисует один статичный кадр
})();
