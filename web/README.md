# Inventory Rampage — Web

Веб-версия Find Good Set с blacklist и диапазонами.

## Запуск

```bash
cd web
python3 -m http.server 8080
# или: npx serve .
```

Открой http://localhost:8080

Worker не работает с `file://` — нужен локальный сервер или хостинг.

## Возможности

- Режим урон / броня
- Диапазоны min–max
- Чёрный список + удаление
- JSON-данные или демо
