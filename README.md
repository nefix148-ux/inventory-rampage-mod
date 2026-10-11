# Inventory Rampage Mod

Модифицированный **Inventory Rampager** для Magic Rampage.

**Репозиторий:** https://github.com/nefix148-ux/inventory-rampage-mod

## Что добавлено

- **Чёрный список** предметов (оружие / броня / кольца), тоников, классов и элементов
- Возможность **убирать** из чёрного списка
- **Диапазоны min–max**:
  - урон, броня, % скорости, импульс прыжка, радиус взрыва, скорость снаряда
- Мульти-выбор параметров перед поиском
- UI-панель для управления всем этим

Меню открывается при нажатии на «Крысу» (Find Good Set).

## Структура

```
src/
  find-good-set.worker.clean.js   ← новый воркер (blacklist + ranges + calcStats)
  find-set-ui-overlay.js          ← UI-панель
docs/
  NOTES.md
  INTEGRATION.md                  ← как вставить в APK
extracted/                        ← оригинал воркера для справки
```

## Статус

- [x] Извлечение ключевых файлов
- [x] Частичная деобфускация
- [x] Чистый воркер с blacklist + ranges + remove
- [x] Портирован реальный расчёт armor/damage
- [x] UI-панель (overlay) для blacklist и диапазонов
- [ ] Полный хук postMessage в оригинальный UI
- [ ] Подробный гайд по пересборке APK

## Быстрый старт

Смотри **docs/INTEGRATION.md**.
