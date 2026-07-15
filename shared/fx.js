/**
 * Кино-утилиты: разбивка заголовков на слова/буквы для оркестрованных
 * титров (как в кино). Сохраняет <br>, <em> и другие вложенные теги.
 */
(function () {
  'use strict';

  function wrapText(node, mode, out) {
    var parts = node.textContent.split(/(\s+)/);
    var frag = document.createDocumentFragment();
    parts.forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
      if (mode === 'words') {
        var w = document.createElement('span');
        w.className = 'fx-w';
        var wi = document.createElement('span');
        wi.className = 'fx-wi';
        wi.textContent = part;
        w.appendChild(wi);
        frag.appendChild(w);
        out.push(wi);
      } else {
        // буквы группируем в неразрывное слово, чтобы не ломать переносы
        var cw = document.createElement('span');
        cw.className = 'fx-cw';
        part.split('').forEach(function (ch) {
          var c = document.createElement('span');
          c.className = 'fx-ch';
          c.textContent = ch;
          cw.appendChild(c);
          out.push(c);
        });
        frag.appendChild(cw);
      }
    });
    node.parentNode.replaceChild(frag, node);
  }

  function split(el, mode) {
    var out = [];
    // копия списка, т.к. дерево меняется на ходу
    Array.prototype.slice.call(el.childNodes).forEach(function walk(node) {
      if (node.nodeType === 3) { wrapText(node, mode, out); return; }
      if (node.nodeType === 1 && node.tagName !== 'BR') {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    });
    return out;
  }

  window.FX = {
    splitWords: function (el) { return split(el, 'words'); },
    splitChars: function (el) { return split(el, 'chars'); },

    /* Прогресс чтения: scaleX полосы по проценту прокрутки */
    progress: function () {
      var bar = document.querySelector('.progress');
      if (!bar) return;
      function upd() {
        var m = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = 'scaleX(' + (m > 0 ? (scrollY / m).toFixed(4) : 0) + ')';
      }
      addEventListener('scroll', upd, { passive: true });
      addEventListener('resize', upd, { passive: true });
      upd();
    },

    /* Бесшовная бегущая строка: контент дублируется дважды */
    marquee: function (items) {
      var track = document.getElementById('marqueeTrack');
      if (!track) return;
      var half = '<span class="marquee-half">' + items.join('&ensp;✦&ensp;') + '&ensp;✦&ensp;</span>';
      track.innerHTML = half + half;
    },

    /* 3D-наклон карточек за курсором */
    tilt: function (selector, max) {
      if (!matchMedia('(hover:hover)').matches) return;
      max = max || 7;
      document.querySelectorAll(selector).forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          card.style.transform =
            'perspective(700px) rotateX(' + (-py * max).toFixed(2) + 'deg) rotateY(' + (px * max).toFixed(2) + 'deg) translateY(-4px)';
        }, { passive: true });
        card.addEventListener('mouseleave', function () { card.style.transform = ''; });
      });
    }
  };
})();
