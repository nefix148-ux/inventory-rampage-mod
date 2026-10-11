# Заметки по реверсу

## find-good-set.worker-j8prte2u.js

- Полностью обфусцирован (string array + shift).
- Ключевые строки из массива:
  - armor, damage, element, darkness, neutral
  - Tonic of Invulnerability, Monsters' Juice, Pepper Brew
  - class, beverage (тоники), weapon, artifact (кольца?), ringBaseArmor
  - baseDmg, baseArmor, currentLevel, levelMax
  - ELEMENTS

Логика примерно такая:
- Берёт оружие / броню / артефакт
- Размножает по возможным элементам (если neutral — все)
- Перебирает классы и тоники (beverage)
- Считает итоговый урон или броню
- Держит топ-комбинации

Нужно добавить:
- blacklist по name / id предмета
- blacklist по element
- blacklist по class / tonic
- вместо max → фильтр minValue <= value <= maxValue для нескольких статов одновременно

## StudioPage

Здесь UI. Искать упоминания "крыс" / rat / find good set / меню фильтров.

## 2026-10-11 progress

- Создан чистый воркер: `src/find-good-set.worker.clean.js`
  - Полная поддержка blacklist (items / tonics / classes / elements)
  - remove из blacklist через helpers
  - min/max диапазоны для damage, armor, speed, jumpImpulse, explosionRadius, projectileSpeed
  - multi-filter
- calcStats портирован из оригинала

## calcStats ported

Из оригинальной `_0x3cb7f9`:

**Armor:**
- leveled base armor from armor piece
- + leveled ring/artifact armor
- * boosts from artifact, weapon, class, tonic (armor / stats keys)

**Damage:**
- leveled base damage from weapon
- * element boosts from armor/artifact/class
- * 1.25 if armor element == weapon element
- * 1.2 if ring element == weapon element
- * subtype / magic multipliers from tonic
- * additional boosts

**ELEMENTS:** fire, earth, water, air, light, darkness, magic, neural (+ neutral)

Остальные статы (speed, jumpImpulse, explosionRadius, projectileSpeed) пока берутся напрямую с предметов — точные формулы нужно дореверсить отдельно, если они считаются сложнее.

## UI (StudioPage / index)

Ключевые маркеры:
- `btn-find-good-set`
- `find-set-toggle-*` (card, title, desc, switch, thumb, track, content, icon)
- sprite: `sprites/ui/find-good-set.webp`
- worker path: `find-good-set.worker-j8prte2u.js`
- locale key: `findSet_topSetsFound`
- message type: `{type: 'find-good-set'}`

Меню «Крысы» = этот find-good-set UI.
