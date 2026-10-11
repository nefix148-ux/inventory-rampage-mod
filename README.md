# Inventory Rampage Mod

Модификации Find Good Set для **Magic Rampage** / Inventory Rampager.

**Репозиторий:** https://github.com/nefix148-ux/inventory-rampage-mod

## Два варианта

### 1. Веб-сайт (рекомендуется)

Папка **`web/`** — полноценный сайт:

```bash
cd web
python3 -m http.server 8080
```

Открой http://localhost:8080

- UI с диапазонами и чёрным списком
- Можно вставить свои данные JSON
- Работает в браузере, без APK

### 2. Патч APK

- `src/find-good-set.worker.clean.js` — воркер
- `src/find-set-ui-overlay.js` — overlay для приложения
- `docs/REBUILD_APK.md` — как пересобрать

## Фичи

- Чёрный список предметов / тоников / классов / элементов + remove
- Диапазоны min–max: урон, броня, скорость, прыжок, радиус взрыва, скорость снаряда
- Мульти-фильтры

## Структура

```
web/                 ← сайт
src/                 ← воркер + overlay для APK
docs/
extracted/
```
