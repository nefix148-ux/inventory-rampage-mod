/**
 * Inventory Rampage — Find Good Set (Web)
 */

const LS_BLACKLIST = 'ir_web_blacklist';
const LS_FILTERS = 'ir_web_filters';

const DEFAULT_BLACKLIST = { items: [], tonics: [], classes: [], elements: [] };
const FILTER_KEYS = [
  { key: 'damage', label: 'Урон' },
  { key: 'armor', label: 'Броня' },
  { key: 'speed', label: 'Скорость %' },
  { key: 'jumpImpulse', label: 'Импульс прыжка' },
  { key: 'explosionRadius', label: 'Радиус взрыва' },
  { key: 'projectileSpeed', label: 'Скорость снаряда' }
];

function load(key, def) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...def, ...JSON.parse(raw) } : structuredClone(def);
  } catch {
    return structuredClone(def);
  }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

let blacklist = load(LS_BLACKLIST, DEFAULT_BLACKLIST);
let filters = load(LS_FILTERS, Object.fromEntries(FILTER_KEYS.map(f => [f.key, { min: null, max: null }])));

function renderFilters() {
  const el = document.getElementById('filters');
  el.innerHTML = FILTER_KEYS.map(({ key, label }) => `
    <div class="f-row">
      <span>${label}</span>
      <input type="number" data-filter="${key}" data-bound="min" placeholder="min" value="${filters[key]?.min ?? ''}" />
      <span class="dash">–</span>
      <input type="number" data-filter="${key}" data-bound="max" placeholder="max" value="${filters[key]?.max ?? ''}" />
    </div>
  `).join('');
  el.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      const k = inp.dataset.filter;
      const b = inp.dataset.bound;
      const v = inp.value === '' ? null : Number(inp.value);
      filters[k] = filters[k] || { min: null, max: null };
      filters[k][b] = v;
      save(LS_FILTERS, filters);
    });
  });
}

function renderBlacklist() {
  ['items', 'tonics', 'classes', 'elements'].forEach(cat => {
    const box = document.getElementById('tags-' + cat);
    const list = blacklist[cat] || [];
    box.innerHTML = list.length
      ? list.map(name => `
          <span class="tag">
            ${escapeHtml(name)}
            <button type="button" data-remove="${cat}" data-name="${escapeAttr(name)}">×</button>
          </span>
        `).join('')
      : '<span style="opacity:0.5;font-size:0.85rem">пусто</span>';
  });
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.remove;
      const name = btn.dataset.name;
      blacklist[cat] = (blacklist[cat] || []).filter(x => x !== name);
      save(LS_BLACKLIST, blacklist);
      renderBlacklist();
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
}
function escapeAttr(s) {
  return String(s).replace(/"/g, '"').replace(/'/g, '&#39;');
}

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.add;
    const map = { items: 'bl-item', tonics: 'bl-tonic', classes: 'bl-class', elements: 'bl-element' };
    const inp = document.getElementById(map[cat]);
    const val = (inp.value || '').trim();
    if (!val) return;
    blacklist[cat] = blacklist[cat] || [];
    if (!blacklist[cat].includes(val)) blacklist[cat].push(val);
    save(LS_BLACKLIST, blacklist);
    inp.value = '';
    renderBlacklist();
  });
});

const DEMO = {
  items: [
    { name: 'Ancient Staff', type: 'weapon', element: 'darkness', subType: 'staff', levelMax: 10, currentLevel: 10, stats: { damage: [8000, 15000] }, boosts: {} },
    { name: 'Fire Blade', type: 'weapon', element: 'fire', subType: 'sword', levelMax: 10, currentLevel: 10, stats: { damage: [7000, 14000] }, boosts: {} },
    { name: 'Neutral Bow', type: 'weapon', element: 'neutral', subType: 'bow', levelMax: 10, currentLevel: 8, stats: { damage: [6000, 12000] }, boosts: {} },
    { name: 'Shadow Plate', type: 'armor', element: 'darkness', levelMax: 10, currentLevel: 10, stats: { armor: [2000, 4500] }, boosts: { armor: 1.1 } },
    { name: 'Flame Mail', type: 'armor', element: 'fire', levelMax: 10, currentLevel: 10, stats: { armor: [1800, 4000] }, boosts: {} },
    { name: 'Light Robe', type: 'armor', element: 'light', levelMax: 10, currentLevel: 9, stats: { armor: [1500, 3200] }, boosts: {} },
    { name: 'Dark Ring', type: 'artifact', element: 'darkness', levelMax: 5, currentLevel: 5, stats: { armor: [300, 800] }, boosts: { darkness: 1.15 } },
    { name: 'Fire Band', type: 'artifact', element: 'fire', levelMax: 5, currentLevel: 5, stats: { armor: [250, 700] }, boosts: {} }
  ],
  classes: [
    { name: 'Mage', boosts: { magic: 1.2, staff: 1.1 } },
    { name: 'Warrior', boosts: { armor: 1.15 } }
  ],
  beverages: [
    { name: "Monsters' Juice", boosts: { damage: 1.1 } },
    { name: 'Pepper Brew', boosts: { fire: 1.2 } },
    { name: 'Tonic of Invulnerability', effects: { armor: 1.25 } }
  ]
};

document.getElementById('loadDemo').addEventListener('click', () => {
  document.getElementById('dataJson').value = JSON.stringify(DEMO, null, 2);
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  document.getElementById('dataJson').value = text;
});

let worker = null;
function getWorker() {
  if (worker) return worker;
  worker = new Worker('./find-good-set.worker.js');
  return worker;
}

document.getElementById('btnSearch').addEventListener('click', () => {
  let data;
  try {
    const raw = document.getElementById('dataJson').value.trim();
    data = raw ? JSON.parse(raw) : DEMO;
  } catch (err) {
    alert('Невалидный JSON: ' + err.message);
    return;
  }

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const topN = Number(document.getElementById('topN').value) || 20;
  const includeUpcoming = document.getElementById('includeUpcoming').checked;

  document.querySelectorAll('#filters input').forEach(inp => {
    const k = inp.dataset.filter;
    const b = inp.dataset.bound;
    filters[k] = filters[k] || { min: null, max: null };
    filters[k][b] = inp.value === '' ? null : Number(inp.value);
  });
  save(LS_FILTERS, filters);

  const payload = {
    mode,
    items: data.items || data.weapons || [],
    classes: data.classes || [],
    beverages: data.beverages || data.tonics || [],
    currentBeverage: data.currentBeverage || null,
    equipped: data.equipped || {},
    includeUpcoming,
    blacklist,
    filters,
    topN
  };

  if (data.items && !Array.isArray(data.items) && data.items.weapons) {
    payload.items = [
      ...(data.items.weapons || []),
      ...(data.items.armors || []),
      ...(data.items.artifacts || [])
    ];
    payload.classes = data.items.classes || data.classes || [];
    payload.beverages = data.items.tonics || data.beverages || [];
  }

  const statusCard = document.getElementById('statusCard');
  const status = document.getElementById('status');
  const resultsCard = document.getElementById('resultsCard');
  statusCard.hidden = false;
  resultsCard.hidden = true;
  status.textContent = 'Поиск…';

  const w = getWorker();
  w.onmessage = (e) => {
    const msg = e.data;
    if (msg.progress != null) {
      status.textContent = `Перебор… ${msg.progress}`;
      return;
    }
    const { topCombinations = [], totalCombinations = 0, durationMs = 0 } = msg;
    status.textContent = `Готово: ${topCombinations.length} из ${totalCombinations} комбинаций за ${durationMs.toFixed(0)} мс`;
    renderResults(topCombinations, totalCombinations, durationMs);
  };
  w.onerror = (err) => {
    status.textContent = 'Ошибка воркера: ' + (err.message || err);
    console.error(err);
  };
  w.postMessage(payload);
});

document.getElementById('btnClear').addEventListener('click', () => {
  document.getElementById('results').innerHTML = '';
  document.getElementById('resultsCard').hidden = true;
  document.getElementById('statusCard').hidden = true;
});

function renderResults(list, total, ms) {
  const card = document.getElementById('resultsCard');
  const box = document.getElementById('results');
  const meta = document.getElementById('resultsMeta');
  card.hidden = false;
  meta.textContent = `(${list.length} / ${total}, ${ms.toFixed(0)} мс)`;
  if (!list.length) {
    box.innerHTML = '<p class="hint">Ничего не найдено. Ослабь фильтры или blacklist.</p>';
    return;
  }
  box.innerHTML = list.map((r, i) => {
    const w = r.weapon || {};
    const a = r.armor || {};
    const art = r.artifact || {};
    const cls = r.class || {};
    const bev = r.beverage || {};
    const st = r.stats || r;
    return `
      <div class="result">
        <div><strong>#${i + 1}</strong> · score ${Number(r.score || st.damage || st.armor || 0).toFixed(0)}</div>
        <div>Оружие: ${escapeHtml(w.name || '—')} (${escapeHtml(w.element || '')})</div>
        <div>Броня: ${escapeHtml(a.name || '—')} (${escapeHtml(a.element || '')})</div>
        <div>Артефакт: ${escapeHtml(art.name || '—')}</div>
        <div>Класс: ${escapeHtml(cls.name || '—')} · Тоник: ${escapeHtml(bev.name || '—')}</div>
        <div class="stats">
          Урон: ${Number(st.damage || 0).toFixed(0)} ·
          Броня: ${Number(st.armor || 0).toFixed(0)} ·
          Скорость: ${Number(st.speed || 0).toFixed(1)} ·
          Прыжок: ${Number(st.jumpImpulse || 0).toFixed(1)} ·
          Взрыв: ${Number(st.explosionRadius || 0).toFixed(1)} ·
          Снаряд: ${Number(st.projectileSpeed || 0).toFixed(1)}
        </div>
      </div>
    `;
  }).join('');
}

renderFilters();
renderBlacklist();
document.getElementById('dataJson').value = JSON.stringify(DEMO, null, 2);
