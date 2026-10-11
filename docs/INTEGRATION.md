# Как интегрировать изменения

## 1. Замена воркера

В APK путь:
`assets/public/assets/find-good-set.worker-j8prte2u.js`

Замени содержимое файла на `src/find-good-set.worker.clean.js`  
(можно просто скопировать и переименовать).

## 2. UI-панель (blacklist + диапазоны)

Файл: `src/find-set-ui-overlay.js`

**Вариант А (простой)** — добавить в `assets/public/index.html` перед `</body>`:

```html
<script src="./assets/find-set-ui-overlay.js"></script>
```

Положи сам файл в `assets/public/assets/find-set-ui-overlay.js`.

**Вариант Б** — если не хочешь трогать index.html, можно вставить содержимое скрипта прямо в конец какого-нибудь существующего JS (например native-bridge.js), но это менее аккуратно.

После загрузки в консоли появится:
`[IR] FindSet UI overlay loaded. Call IRFindSetUI.open() to show panel.`

Панель также попытается автоматически открываться при клике на кнопку «Крысы» (`#btn-find-good-set`).

### API панели

```js
IRFindSetUI.open()                          // открыть
IRFindSetUI.close()                         // закрыть
IRFindSetUI.getBlacklist()                  // { items, tonics, classes, elements }
IRFindSetUI.getFilters()                    // { damage:{min,max}, ... }
IRFindSetUI.addToBlacklist('items', 'Ancient Staff')
IRFindSetUI.removeFromBlacklist('items', 'Ancient Staff')
IRFindSetUI.enhanceMessage(originalMsg)     // подмешивает blacklist + filters
```

Данные сохраняются в `localStorage` (`ir_blacklist`, `ir_filters`).

## 3. Как воркер получает фильтры

В идеале нужно пропатчить место, где отправляется `postMessage` в воркер, чтобы вызывать:

```js
worker.postMessage(IRFindSetUI.enhanceMessage({
  items: { weapons, armors, artifacts, classes, tonics },
  mode: "damage",
  topN: 30
}));
```

Пока UI-панель работает независимо — ты можешь выставлять blacklist/ranges, а полный хук в postMessage можно допилить позже.

## 4. Сборка APK

1. Распаковать APK (apktool или просто unzip)
2. Заменить worker
3. Добавить overlay-скрипт + подключить в index.html
4. Запаковать обратно + подписать (uber-apk-signer / apksigner)

Подробный гайд по пересборке могу написать отдельно, если нужно.
