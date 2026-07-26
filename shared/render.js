/**
 * Общий рендер контента курса для всех вариантов.
 * Контракт — одинаковые id в разметке каждого варианта:
 * aboutText, b1label/b1name/b1desc, methodGrid, b2label/b2name/b2desc,
 * trail, destination, fmtName, stats, formatList, featName, featGrid,
 * audName, audText, audKids, finalTitle, finalSub, priceNote,
 * [data-cta], [data-start-chip].
 */
(function () {
  'use strict';

  var ICONS = {
    map:  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14"/></svg>',
    quiz: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11.5a3 3 0 1 1 4 2.8c-.9.4-1 .9-1 1.7m0 3v.2M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"/></svg>',
    chat: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Zm-12-1h6m-6 3h4"/></svg>',
    book: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13M8 7h7"/></svg>',
    rec:  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 10 5-3v10l-5-3m-11 4h9a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/></svg>'
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function put(id, value, asHtml) {
    var n = document.getElementById(id);
    if (n) { if (asHtml) n.innerHTML = value; else n.textContent = value; }
    return n;
  }

  window.renderCourse = function () {
    var C = window.COURSE, CFG = window.COURSE_CONFIG;

    // О курсе
    var aboutBox = document.getElementById('aboutText');
    if (aboutBox) C.about.concat([C.blocksIntro]).forEach(function (t) {
      var p = el('p', null, t);
      p.setAttribute('data-reveal', '');
      aboutBox.appendChild(p);
    });

    // Блок 1
    put('b1label', C.block1.label);
    put('b1name', C.block1.name);
    put('b1desc', C.block1.desc);
    var mg = document.getElementById('methodGrid');
    if (mg) C.block1.items.forEach(function (it, i) {
      var card = el('article', 'm-card');
      card.setAttribute('data-reveal', '');
      card.appendChild(el('span', 'idx', String(i + 1)));
      card.appendChild(el('h3', null, it.title));
      card.appendChild(el('p', null, it.text));
      mg.appendChild(card);
    });

    // Блок 2 — остановки
    put('b2label', C.block2.label);
    put('b2name', C.block2.name);
    put('b2desc', C.block2.desc);
    var trail = document.getElementById('trail');
    var destination = document.getElementById('destination');
    if (trail) C.block2.items.forEach(function (it, i) {
      var stop = el('article', 'stop ' + (i % 2 ? 'right' : 'left'));
      stop.appendChild(el('div', 'marker', String(i + 1)));
      var card = el('div', 'stop-card');
      card.appendChild(el('span', 'stop-tag', 'Остановка ' + (i + 1) + ' из ' + C.block2.items.length));
      card.appendChild(el('h3', null, it.stop));
      card.appendChild(el('p', null, it.text));
      stop.appendChild(card);
      trail.insertBefore(stop, destination);
    });

    // Формат
    put('fmtName', C.format.name);
    var statsBox = document.getElementById('stats');
    if (statsBox) C.format.stats.forEach(function (s) {
      var d = el('div', 'stat');
      d.setAttribute('data-reveal', '');
      var num = el('div', 'stat-num', '0');
      num.dataset.target = s.num;
      d.appendChild(num);
      d.appendChild(el('div', 'stat-unit', s.unit));
      d.appendChild(el('div', 'stat-note', s.note));
      statsBox.appendChild(d);
    });
    var fmtList = document.getElementById('formatList');
    if (fmtList) C.format.list.forEach(function (t) {
      var li = el('li', null, t);
      li.setAttribute('data-reveal', '');
      fmtList.appendChild(li);
    });

    // Фишки
    put('featName', C.features.name);
    var fg = document.getElementById('featGrid');
    if (fg) C.features.items.forEach(function (it) {
      var card = el('article', 'f-card');
      card.setAttribute('data-reveal', '');
      card.appendChild(el('div', 'ico', ICONS[it.icon] || ''));
      card.appendChild(el('h3', null, it.title));
      card.appendChild(el('p', null, it.text));
      fg.appendChild(card);
    });

    // Кому подойдёт / финал
    put('audName', C.audience.name);
    put('audText', C.audience.text);
    put('audKids', C.audience.kids);
    put('finalTitle', C.finalCta.title.replace('прямо сейчас', '<em>прямо сейчас</em>'), true);
    put('finalSub', C.finalCta.sub);
    put('priceNote', CFG.price ? ('Стоимость: ' + CFG.price) : CFG.priceNote);

    // CTA и дата старта
    var placeholder = !CFG.ctaUrl || CFG.ctaUrl === '#';
    document.querySelectorAll('[data-cta]').forEach(function (a, i) {
      a.textContent = CFG.ctaLabel;
      if (placeholder) {
        a.href = i === 0 ? '#cta' : '#';
        if (i > 0) a.addEventListener('click', function (e) { e.preventDefault(); });
      } else {
        a.href = CFG.ctaUrl;
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
    document.querySelectorAll('[data-start-chip]').forEach(function (chip) {
      chip.innerHTML = '<b>Старт: ' + CFG.startDate + '</b>' + (CFG.startDateNote ? ' · ' + CFG.startDateNote : '');
    });

    wrapSalawat(document.body);
  };

  /* Салават ﷺ (U+FDFA) заворачиваем в <span class="slw">, чтобы кегль лигатуры
     задавался отдельно от текста. Через size-adjust у @font-face не выходит:
     он множит кегль пропорционально, а лигатуре нужно обратное — в мелком
     тексте её надо укрупнять, а в 92-пиксельном заголовке она и так велика
     и при множителе наезжала на соседние буквы. */
  function wrapSalawat(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.indexOf('ﷺ') !== -1 &&
          !(node.parentElement && node.parentElement.classList.contains('slw'))) {
        hits.push(node);
      }
    }
    hits.forEach(function (text) {
      var frag = document.createDocumentFragment();
      var parts = text.nodeValue.split('ﷺ');
      parts.forEach(function (part, i) {
        // Пробел перед салаватом делаем неразрывным: иначе лигатура
        // отрывается от имени и уезжает на свою строку одна
        if (i < parts.length - 1) part = part.replace(/ $/, ' ');
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
          var s = document.createElement('span');
          s.className = 'slw';
          s.textContent = 'ﷺ';
          frag.appendChild(s);
        }
      });
      text.parentNode.replaceChild(frag, text);
    });
  }
})();
