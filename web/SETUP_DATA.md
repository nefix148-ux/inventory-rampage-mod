# Данные для иконок и полного списка предметов

UI уже обновлён в репозитории. Чтобы были **все предметы с русскими именами и картинками**:

## 1. Render

В настройках Static Site:
- **Root Directory** или **Publish Directory** = `web`
- Build Command пустой
- Redeploy

## 2. Каталог и спрайты

Файлы лежат локально у сборки (слишком большие для авто-пуша через API):

- `web/data/catalog.json` — 369 предметов + классы + тоники (RU имена)
- `web/sprites/` — иконки оружия/брони/тоников

### Как залить через GitHub сайт

1. Открой репо → папка `web/data/`
2. Add file → Upload file → залей `catalog.json`
3. Для спрайтов удобнее с ПК:

```bash
git clone https://github.com/nefix148-ux/inventory-rampage-mod.git
# скопируй catalog.json и папку sprites в web/
cd inventory-rampage-mod
git add web/data/catalog.json web/sprites
git commit -m "game data"
git push
```

После пуша Render подтянет деплой сам (если подключён GitHub).

## 3. Поведение UI

- Вкладки как меню приложения
- Нет скролла влево-вправо
- Чёрный список: сетка с иконками, поиск «катак» → Доспех Катаклизма
- Можно просто листать и тыкать предметы
