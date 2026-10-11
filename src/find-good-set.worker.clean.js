/**
 * Clean rewritten find-good-set worker with extended filters.
 * Ported core logic from original obfuscated worker + new features.
 *
 * Incoming message:
 * {
 *   items: { weapons:[], armors:[], artifacts:[], classes:[], tonics:[] },
 *   mode: "damage" | "armor",
 *   filters: {
 *     damage: {min, max},
 *     armor: {min, max},
 *     speed: {min, max},
 *     jumpImpulse: {min, max},
 *     explosionRadius: {min, max},
 *     projectileSpeed: {min, max}
 *   },
 *   blacklist: {
 *     items: string[],      // names
 *     tonics: string[],
 *     classes: string[],
 *     elements: string[]
 *   },
 *   topN: 20,
 *   // optional precomputed bases
 *   precomputed?: { armorBaseArmor, ringBaseArmor, weaponBaseDmg }
 * }
 */

const ELEMENTS = ["fire", "earth", "water", "air", "light", "darkness", "magic", "neural"];

function normalizeElement(el) {
  if (el == null || el === "") return "neutral";
  const s = String(el).toLowerCase();
  return s === "currentlevel" ? "levelmax" : s; // leftover from bad deob, ignore
}

function isNeutral(item) {
  return normalizeElement(getElement(item)) === "neutral";
}

function getElement(item) {
  if (!item) return "neutral";
  if (item.originalElement != null && item.originalElement !== "") {
    return normalizeElement(item.originalElement);
  }
  return normalizeElement(item.element);
}

function getPossibleElements(item, allowed) {
  if (isNeutral(item)) return allowed.slice();
  const el = getElement(item);
  if (!el || el === "neutral") return allowed.slice();
  return [el];
}

function levelValue(range, currentLevel, levelMax) {
  // range is [minVal, maxVal] or just number
  if (!range) return 0;
  if (typeof range === "number") return range;
  const [base, maxV] = range;
  if (currentLevel <= 0 || levelMax <= 0) return base;
  return base + (maxV - base) / levelMax * currentLevel;
}

function getBoost(item, key) {
  if (!item || !item.boosts) return 1;
  return item.boosts[key] !== undefined ? item.boosts[key] : 1;
}

function mapSubtype(sub) {
  const s = String(sub || "").toLowerCase();
  if (s === "originalElement" || s === "staff") return "staff"; // placeholder
  if (s === "armorBaseArmor") return "map"; // leftover
  return s;
}

/**
 * Core stats calculation — ported from original _0x3cb7f9
 * Params roughly: armorItem, artifactItem, weaponItem, classItem, tonicBoosts, tonicItem, 
 *                 armorEl, artifactEl, weaponEl, precomputed
 */
function calcStats(armor, artifact, weapon, cls, tonicBoosts, tonic, armorEl, artEl, weaponEl, pre) {
  // --- ARMOR ---
  let armorVal = 0;
  if (pre && pre.armorBaseArmor !== undefined) {
    armorVal = pre.armorBaseArmor;
  } else if (armor && armor.stats && armor.stats.armor) {
    const lvl = armor.currentLevel !== undefined ? armor.currentLevel : (armor.levelMax || 0);
    armorVal = levelValue(armor.stats.armor, lvl, armor.levelMax || 0);
  }

  let ringArmor = 0;
  if (pre && pre.ringBaseArmor !== undefined) {
    ringArmor = pre.ringBaseArmor;
  } else if (artifact && artifact.stats && artifact.stats.armor) {
    const lvl = artifact.currentLevel !== undefined ? artifact.currentLevel : (artifact.levelMax || 0);
    ringArmor = levelValue(artifact.stats.armor, lvl, artifact.levelMax || 0);
  }

  let totalArmor = armorVal + ringArmor;
  totalArmor *= getBoost(artifact, "armor");
  totalArmor *= getBoost(weapon, "armor");
  totalArmor *= getBoost(cls, "armor");
  totalArmor *= (tonicBoosts && tonicBoosts.armor) || 1;
  totalArmor *= (tonicBoosts && tonicBoosts.stats) || 1; // rough

  const tonicEffects = tonic && (tonic.effects || tonic.boosts);
  if (tonicEffects && tonicEffects.armor) totalArmor *= tonicEffects.armor;

  // --- DAMAGE ---
  let damageVal = 0;
  if (weapon && weapon.stats && weapon.stats.damage) {
    let baseDmg = 0;
    if (pre && pre.weaponBaseDmg !== undefined) {
      baseDmg = pre.weaponBaseDmg;
    } else {
      const lvl = weapon.currentLevel !== undefined ? weapon.currentLevel : (weapon.levelMax || 0);
      baseDmg = levelValue(weapon.stats.damage, lvl, weapon.levelMax || 0);
    }

    const weaponSub = weapon.subType;
    const mappedSub = mapSubtype(weaponSub);
    const wEl = weaponEl || weapon.element || "neutral";
    const aEl = armorEl || (armor && armor.element) || "neutral";
    const rEl = artEl || (artifact && artifact.element) || "neutral";

    const getElBoost = (it, el) => {
      let b = getBoost(it, el);
      if (b === 1) b = getBoost(it, "magic"); // fallback magic?
      return b;
    };

    let dmg = baseDmg;
    dmg *= getElBoost(armor, wEl);
    if (armor && wEl !== "neutral" && aEl === wEl) dmg *= 1.25; // same element armor bonus
    dmg *= getElBoost(artifact, wEl);
    if (artifact && wEl !== "neutral" && rEl === wEl) dmg *= 1.2; // same element ring bonus
    dmg *= getElBoost(cls, wEl);
    dmg *= getBoost(cls, mappedSub);

    // tonic element / type multipliers
    let tonMul = 1;
    if (weaponSub && tonicBoosts && tonicBoosts[weaponSub]) tonMul *= tonicBoosts[weaponSub];
    if (mappedSub && mappedSub !== weaponSub && tonicBoosts && tonicBoosts[mappedSub]) tonMul *= tonicBoosts[mappedSub];
    if (wEl !== weaponSub && wEl !== mappedSub && tonicBoosts && tonicBoosts[wEl]) tonMul *= tonicBoosts[wEl];
    if (weaponSub !== "magic" && mappedSub !== "magic" && wEl !== "magic" && tonicBoosts && tonicBoosts.magic) {
      tonMul *= tonicBoosts.magic;
    }
    dmg *= tonMul;

    dmg *= getBoost(armor, mappedSub);
    dmg *= getBoost(artifact, mappedSub);
    if (tonicEffects && tonicEffects.magic) dmg *= tonicEffects.magic;

    damageVal = dmg;
  }

  // Placeholder for other stats (need more reverse for exact formulas)
  // In real game these come from item effects / class / tonic
  const extra = {
    speed: (weapon && weapon.speed) || (armor && armor.speed) || 0,
    jumpImpulse: (weapon && weapon.jumpImpulse) || 0,
    explosionRadius: (weapon && weapon.explosionRadius) || 0,
    projectileSpeed: (weapon && weapon.projectileSpeed) || 0
  };

  return {
    armor: totalArmor,
    damage: damageVal,
    ...extra
  };
}

function isBlacklisted(item, blSet) {
  if (!item) return false;
  const name = String(item.name || item.id || "").toLowerCase();
  return blSet.has(name);
}

self.onmessage = function (e) {
  const t0 = performance.now();
  const data = e.data || {};
  const {
    items = {},
    mode = "damage",
    filters = {},
    blacklist = {},
    topN = 20,
    precomputed = null
  } = data;

  const blItems = new Set((blacklist.items || []).map(s => String(s).toLowerCase()));
  const blTonics = new Set((blacklist.tonics || []).map(s => String(s).toLowerCase()));
  const blClasses = new Set((blacklist.classes || []).map(s => String(s).toLowerCase()));
  const blElements = new Set((blacklist.elements || []).map(s => String(s).toLowerCase()));

  const weapons = (items.weapons || []).filter(i => !isBlacklisted(i, blItems));
  const armors  = (items.armors  || []).filter(i => !isBlacklisted(i, blItems));
  const arts    = (items.artifacts || []).filter(i => !isBlacklisted(i, blItems));
  const classes = (items.classes || []).filter(c => !blClasses.has(String(c.name || c.id || c).toLowerCase()));
  const tonics  = (items.tonics  || []).filter(t => !blTonics.has(String(t.name || t.id || t).toLowerCase()));

  if (!weapons.length || !armors.length) {
    self.postMessage({ topCombinations: [], totalCombinations: 0, durationMs: performance.now() - t0 });
    return;
  }

  const allowedElements = ELEMENTS.filter(el => !blElements.has(el));
  const results = [];
  let total = 0;

  const classList = classes.length ? classes : [null];
  const tonicList = tonics.length ? tonics : [null];
  const artList = arts.length ? arts : [null];

  for (const w of weapons) {
    const wEls = getPossibleElements(w, allowedElements);
    if (!wEls.length) continue;

    for (const a of armors) {
      const aEls = getPossibleElements(a, allowedElements);
      if (!aEls.length) continue;

      for (const art of artList) {
        const artEls = art ? getPossibleElements(art, allowedElements) : [null];
        if (art && !artEls.length) continue;

        for (const cls of classList) {
          for (const ton of tonicList) {
            // tonic boosts object (simplified)
            const tonicBoosts = (ton && (ton.boosts || ton.effects)) || {};

            for (const we of wEls) {
              for (const ae of aEls) {
                for (const arte of artEls) {
                  total++;
                  const stats = calcStats(a, art, w, cls, tonicBoosts, ton, ae, arte, we, precomputed);

                  if (!passesFilters(stats, filters)) continue;

                  const score = mode === "armor" ? stats.armor : stats.damage;
                  results.push({
                    weapon: { ...w, element: we },
                    armor: { ...a, element: ae },
                    artifact: art ? { ...art, element: arte } : null,
                    class: cls,
                    beverage: ton,
                    stats,
                    score
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  results.sort((x, y) => y.score - x.score || (mode === "armor" ? y.stats.damage - x.stats.damage : y.stats.armor - x.stats.armor));
  const top = results.slice(0, topN);

  self.postMessage({
    topCombinations: top,
    totalCombinations: total,
    durationMs: performance.now() - t0
  });
};

function passesFilters(stats, filters) {
  const map = [
    ["damage", stats.damage],
    ["armor", stats.armor],
    ["speed", stats.speed],
    ["jumpImpulse", stats.jumpImpulse],
    ["explosionRadius", stats.explosionRadius],
    ["projectileSpeed", stats.projectileSpeed]
  ];
  for (const [key, val] of map) {
    const f = filters[key];
    if (!f) continue;
    if (f.min != null && val < f.min) return false;
    if (f.max != null && val > f.max) return false;
  }
  return true;
}

// Helpers that UI can call / keep in sync with localStorage etc.
self.blacklistHelpers = {
  add(bl, category, name) {
    bl[category] = bl[category] || [];
    const n = String(name);
    if (!bl[category].includes(n)) bl[category].push(n);
  },
  remove(bl, category, name) {
    bl[category] = (bl[category] || []).filter(x => x !== String(name));
  },
  has(bl, category, name) {
    return (bl[category] || []).includes(String(name));
  }
};
