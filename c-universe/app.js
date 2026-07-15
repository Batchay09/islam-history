/**
 * Вариант В «Сотворение вселенной»: медленная, величественная постановка.
 * Титры проявляются из темноты; при скролле рождается свет (genesis),
 * кинотеатральные шторки раскрываются, туманности расцветают,
 * Земля восходит. Никаких резких полётов — только плавное движение.
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
    var lenis = new Lenis({ lerp: .075 }); // медленный, «космический» скролл
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var earth = document.getElementById('earth');

  /* ---------- Титры: проявление из темноты ---------- */
  if (!reduced) {
    var h1 = document.querySelector('#phase1 h1');
    var words = window.FX ? FX.splitWords(h1) : [];
    gsap.set(words, { yPercent: 108 });
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('#phase1', { filter: 'blur(6px)' }, { filter: 'blur(0px)', duration: 2.2, ease: 'power2.out' }, 0)
      .fromTo('#phase1 .eyebrow', { opacity: 0 }, { opacity: 1, duration: 1.4 }, .3)
      .to(words, { yPercent: 0, duration: 1.5, stagger: .09, ease: 'power4.out' }, .55)
      .set(h1, { opacity: 1 }, .55)
      .fromTo('#phase1 .hero-lead', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.3 }, 1.5)
      .fromTo('#phase1 .hero-cta', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.3 }, 1.8)
      .fromTo('.scroll-hint', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 2.4);
  }

  /* ---------- Пролог: свет → туманности → Земля ---------- */
  if (reduced) {
    ['phase2', 'phase3'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.style.display = 'none';
    });
    if (earth) earth.style.display = 'none';
  } else {
    var glowProxy = { g: 1 };
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#prologue',
        start: 'top top',
        end: '+=260%',
        scrub: .8,               // тягучее, инерционное движение
        pin: true,
        anticipatePin: 1
      },
      defaults: { ease: 'power1.inOut' }
    });

    tl
      // титры медленно растворяются
      .to('#phase1', { autoAlpha: 0, y: -46, scale: .98, duration: 1 }, .1)
      // рождается точка света и распускается в сияние
      .fromTo('#genesis', { scale: .1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2 }, .5)
      // шторки кинозала медленно раскрываются
      .to('.bar-t', { yPercent: -100, duration: 2, ease: 'power2.inOut' }, .6)
      .to('.bar-b', { yPercent: 100, duration: 2, ease: 'power2.inOut' }, .6)
      // свет заполняет пространство, туманности расцветают, звёзды теплеют
      .to('#genesis', { scale: 3.2, opacity: 0, duration: 1.6, ease: 'power2.in' }, 1.6)
      .to('#nebulaWrap', { scale: 1.22, duration: 3.4, ease: 'none' }, .8)
      .to(glowProxy, {
        g: 1.28, duration: 1.4,
        onUpdate: function () { window.__starGlow = glowProxy.g; }
      }, 1.4)
      .fromTo('#phase2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power2.out' }, 1.9)
      .to('#phase2', { autoAlpha: 0, y: -40, duration: .9 }, 3.1)
      .to(glowProxy, {
        g: 1, duration: 1.2,
        onUpdate: function () { window.__starGlow = glowProxy.g; }
      }, 3.2)
      // Земля восходит — медленно, как рассвет из космоса
      .fromTo('#earth', { xPercent: -50, yPercent: 108 }, { xPercent: -50, yPercent: 0, duration: 1.9, ease: 'power1.out' }, 3.5)
      .fromTo('#phase3', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power2.out' }, 4.1);
  }

  /* ---------- Reveal ---------- */
  if (!reduced) {
    document.querySelectorAll('[data-reveal]').forEach(function (node) {
      if (node.closest('.prologue')) return; // пролог ставит своя постановка
      if (node.tagName === 'H2') {
        // заголовки восходят из-за нижней кромки маски
        gsap.fromTo(node,
          { opacity: 1, clipPath: 'inset(105% 0 -12% 0)', y: 20 },
          {
            clipPath: 'inset(-12% 0 -12% 0)', y: 0, duration: 1.5, ease: 'power3.out',
            scrollTrigger: { trigger: node, start: 'top 86%', once: true }
          });
      } else {
        gsap.fromTo(node,
          { opacity: 0, y: 38, scale: .985 },
          {
            opacity: 1, y: 0, scale: 1, duration: 1.35, ease: 'power4.out',
            scrollTrigger: { trigger: node, start: 'top 88%', once: true }
          });
      }
    });
  }

  /* ---------- Глубина: контент плывёт медленнее фона — слои при падении ---------- */
  if (!reduced) {
    document.querySelectorAll('.about .wrap-narrow, .method .wrap, .format .wrap, .features .wrap, .audience .wrap-narrow, .final .final-inner')
      .forEach(function (el) {
        gsap.fromTo(el, { yPercent: 4 }, {
          yPercent: -4, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .6 }
        });
      });
  }

  /* ---------- Темы блока 2 + карта ---------- */
  var cities = Array.prototype.slice.call(document.querySelectorAll('#mapSvg .city'));
  var cityIdx = -1;
  function lightNextCity() {
    cityIdx = (cityIdx + 1) % cities.length;
    cities.forEach(function (c, i) { c.classList.toggle('on', i === cityIdx); });
  }

  // маршрут на карте прорисовывается, когда карта входит в кадр
  var route = document.getElementById('routePath');
  if (route) {
    var rlen = route.getTotalLength();
    if (reduced) {
      route.style.strokeDasharray = 'none';
    } else {
      route.style.strokeDasharray = rlen;
      route.style.strokeDashoffset = rlen;
      gsap.to(route, {
        strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut',
        scrollTrigger: { trigger: '.map-card', start: 'top 78%', once: true }
      });
    }
  }

  document.querySelectorAll('.stop').forEach(function (stop) {
    if (!reduced) {
      gsap.fromTo(stop,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: stop, start: 'top 85%', once: true }
        });
    }
    ScrollTrigger.create({
      trigger: stop, start: 'top 60%', end: 'bottom 40%',
      onToggle: function (self) {
        stop.classList.toggle('is-active', self.isActive);
        if (self.isActive) lightNextCity();
      }
    });
  });
  if (reduced && cities.length) cities[0].classList.add('on');

  /* ---------- Счётчики ---------- */
  document.querySelectorAll('.stat-num').forEach(function (numEl) {
    var target = parseFloat(numEl.dataset.target);
    var isFloat = target % 1 !== 0;
    function fmt(v) { return isFloat ? v.toFixed(1).replace('.', ',') : String(Math.round(v)); }
    if (reduced) { numEl.textContent = fmt(target); return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.8, ease: 'power2.out',
      onUpdate: function () { numEl.textContent = fmt(obj.v); },
      scrollTrigger: { trigger: numEl, start: 'top 85%', once: true }
    });
  });

  var resizeT;
  addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
  }, { passive: true });
})();
