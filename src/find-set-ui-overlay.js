/**
 * Find Good Set UI Overlay
 * Панель для blacklist + min/max диапазонов.
 * Можно внедрить через injection в index.html или как отдельный скрипт.
 *
 * Хранит данные в localStorage:
 *   ir_blacklist  = { items:[], tonics:[], classes:[], elements:[] }
 *   ir_filters    = { damage:{min,max}, armor:{min,max}, ... }
 */

(function () {
  'use strict';

  const LS_BLACKLIST = 'ir_blacklist';
  const LS_FILTERS = 'ir_filters';

  const DEFAULT_BLACKLIST = { items: [], tonics: [], classes: [], elements: [] };
  const DEFAULT_FILTERS = {
    damage: { min: null, max: null },
    armor: { min: null, max: null },
    speed: { min: null, max: null },
    jumpImpulse: { min: null, max: null },
    explosionRadius: { min: null, max: null },
    projectileSpeed: { min: null, max: null }
  };

  function load(key, def) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...def, ...JSON.parse(raw) } : { ...def };
    } catch {
      return { ...def };
    }
  }

  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // --- Public API ---
  window.IRFindSetUI = {
    getBlacklist() {
      return load(LS_BLACKLIST, DEFAULT_BLACKLIST);
    },
    getFilters() {
      return load(LS_FILTERS, DEFAULT_FILTERS);
    },
    setBlacklist(bl) {
      save(LS_BLACKLIST, bl);
    },
    setFilters(f) {
      save(LS_FILTERS, f);
    },
    addToBlacklist(category, name) {
      const bl = this.getBlacklist();
      bl[category] = bl[category] || [];
      if (!bl[category].includes(name)) bl[category].push(name);
      this.setBlacklist(bl);
      this.render();
    },
    removeFromBlacklist(category, name) {
      const bl = this.getBlacklist();
      bl[category] = (bl[category] || []).filter(x => x !== name);
      this.setBlacklist(bl);
      this.render();
    },
    /** Подмешивает blacklist + filters в сообщение воркеру */
    enhanceMessage(msg) {
      return {
        ...msg,
        blacklist: this.getBlacklist(),
        filters: this.getFilters()
      };
    },
    open() {
      ensurePanel();
      document.getElementById('ir-findset-panel').style.display = 'flex';
      this.render();
    },
    close() {
      const p = document.getElementById('ir-findset-panel');
      if (p) p.style.display = 'none';
    },
    render
  };

  // --- Panel DOM ---
  function ensurePanel() {
    if (document.getElementById('ir-findset-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #ir-findset-panel {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.65);
        display: none; align-items: center; justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #ir-findset-panel .ir-card {
        background: #1a1a2e; color: #eee; border-radius: 16px;
        width: min(480px, 94vw); max-height: 90vh; overflow-y: auto;
        padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      }
      #ir-findset-panel h2 { margin: 0 0 12px; font-size: 1.25rem; }
      #ir-findset-panel h3 { margin: 16px 0 8px; font-size: 0.95rem; color: #a5b4fc; }
      #ir-findset-panel .ir-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }
      #ir-findset-panel input[type=number] {
        width: 90px; padding: 6px 8px; border-radius: 8px;
        border: 1px solid #333; background: #0f0f1a; color: #fff;
      }
      #ir-findset-panel input[type=text] {
        flex: 1; padding: 6px 8px; border-radius: 8px;
        border: 1px solid #333; background: #0f0f1a; color: #fff;
      }
      #ir-findset-panel button {
        padding: 6px 12px; border-radius: 8px; border: none;
        background: #4f46e5; color: #fff; cursor: pointer; font-size: 0.85rem;
      }
      #ir-findset-panel button.ir-danger { background: #dc2626; }
      #ir-findset-panel button.ir-ghost { background: #333; }
      #ir-findset-panel .ir-tag {
        display: inline-flex; align-items: center; gap: 4px;
        background: #312e81; padding: 3px 8px; border-radius: 999px;
        font-size: 0.8rem; margin: 2px;
      }
      #ir-findset-panel .ir-tag button {
        background: transparent; padding: 0 2px; font-size: 0.9rem; line-height: 1;
      }
      #ir-findset-panel .ir-close {
        float: right; background: transparent; font-size: 1.4rem; padding: 0 4px;
      }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'ir-findset-panel';
    panel.innerHTML = `
      <div class="ir-card">
        <button class="ir-close ir-ghost" onclick="IRFindSetUI.close()">×</button>
        <h2>Find Good Set — фильтры</h2>

        <h3>Диапазоны</h3>
        <div id="ir-filters-area"></div>

        <h3>Чёрный список предметов</h3>
        <div class="ir-row">
          <input type="text" id="ir-add-item" placeholder="Название предмета">
          <button onclick="IRFindSetUI._add('items')">+</button>
        </div>
        <div id="ir-bl-items"></div>

        <h3>Чёрный список тоников</h3>
        <div class="ir-row">
          <input type="text" id="ir-add-tonic" placeholder="Название тоника">
          <button onclick="IRFindSetUI._add('tonics')">+</button>
        </div>
        <div id="ir-bl-tonics"></div>

        <h3>Чёрный список классов</h3>
        <div class="ir-row">
          <input type="text" id="ir-add-class" placeholder="Название класса">
          <button onclick="IRFindSetUI._add('classes')">+</button>
        </div>
        <div id="ir-bl-classes"></div>

        <h3>Чёрный список элементов</h3>
        <div class="ir-row">
          <input type="text" id="ir-add-element" placeholder="darkness / fire / ...">
          <button onclick="IRFindSetUI._add('elements')">+</button>
        </div>
        <div id="ir-bl-elements"></div>

        <div style="margin-top:18px;display:flex;gap:8px;">
          <button class="ir-ghost" onclick="IRFindSetUI.close()">Закрыть</button>
          <button onclick="IRFindSetUI._saveFilters()">Сохранить диапазоны</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // helpers bound to UI
    window.IRFindSetUI._add = function (cat) {
      const map = { items: 'ir-add-item', tonics: 'ir-add-tonic', classes: 'ir-add-class', elements: 'ir-add-element' };
      const inp = document.getElementById(map[cat]);
      const val = (inp.value || '').trim();
      if (!val) return;
      this.addToBlacklist(cat, val);
      inp.value = '';
    };

    window.IRFindSetUI._saveFilters = function () {
      const f = this.getFilters();
      const keys = ['damage', 'armor', 'speed', 'jumpImpulse', 'explosionRadius', 'projectileSpeed'];
      keys.forEach(k => {
        const minEl = document.getElementById('ir-f-' + k + '-min');
        const maxEl = document.getElementById('ir-f-' + k + '-max');
        f[k] = {
          min: minEl.value === '' ? null : Number(minEl.value),
          max: maxEl.value === '' ? null : Number(maxEl.value)
        };
      });
      this.setFilters(f);
      alert('Диапазоны сохранены');
    };
  }

  function render() {
    ensurePanel();
    const bl = window.IRFindSetUI.getBlacklist();
    const f = window.IRFindSetUI.getFilters();

    // filters
    const labels = {
      damage: 'Урон',
      armor: 'Броня',
      speed: 'Скорость %',
      jumpImpulse: 'Импульс прыжка',
      explosionRadius: 'Радиус взрыва',
      projectileSpeed: 'Скорость снаряда'
    };
    const area = document.getElementById('ir-filters-area');
    area.innerHTML = Object.keys(labels).map(k => `
      <div class="ir-row">
        <span style="width:130px">${labels[k]}</span>
        <input type="number" id="ir-f-${k}-min" placeholder="min" value="${f[k]?.min ?? ''}">
        <span>–</span>
        <input type="number" id="ir-f-${k}-max" placeholder="max" value="${f[k]?.max ?? ''}">
      </div>
    `).join('');

    // blacklist tags
    function renderTags(cat, elId) {
      const el = document.getElementById(elId);
      const list = bl[cat] || [];
      el.innerHTML = list.length
        ? list.map(name => `
            <span class="ir-tag">
              ${name}
              <button onclick="IRFindSetUI.removeFromBlacklist('${cat}','${name.replace(/'/g, "\\'")}')">×</button>
            </span>
          `).join('')
        : '<span style="opacity:0.5;font-size:0.85rem">пусто</span>';
    }
    renderTags('items', 'ir-bl-items');
    renderTags('tonics', 'ir-bl-tonics');
    renderTags('classes', 'ir-bl-classes');
    renderTags('elements', 'ir-bl-elements');
  }

  // Авто-открытие по кнопке Крысы (если найдём)
  function tryHookButton() {
    const btn = document.querySelector('#btn-find-good-set, .btn-find-good-set, [class*="find-good-set"]');
    if (btn && !btn.dataset.irHooked) {
      btn.dataset.irHooked = '1';
      btn.addEventListener('click', () => {
        // даём оригинальному UI открыться, потом показываем свою панель
        setTimeout(() => window.IRFindSetUI.open(), 300);
      });
    }
  }

  // ждём загрузки
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryHookButton);
  } else {
    tryHookButton();
  }
  // на всякий случай ещё раз через секунду
  setTimeout(tryHookButton, 1500);

  console.log('[IR] FindSet UI overlay loaded. Call IRFindSetUI.open() to show panel.');
})();
