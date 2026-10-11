# Как интегрировать изменения

## 1. Замена воркера

В APK:
`assets/public/assets/find-good-set.worker-j8prte2u.js`

Заменить содержимое на `src/find-good-set.worker.clean.js` 
(или переименовать clean в то же имя).

## 2. Blacklist + ranges

UI пока не пропатчен. Временный вариант:
- Хранить blacklist/filters в localStorage под ключами:
  - `ir_blacklist`
  - `ir_filters`
- При отправке сообщения в worker подмешивать их.

Пример вызова (для будущего патча UI):

```js
worker.postMessage({
  items: { weapons, armors, artifacts, classes, tonics },
  mode: "damage", // или "armor"
  filters: {
    damage: { min: 10000, max: 20000 },
    armor: { min: null, max: null },
    // ...
  },
  blacklist: {
    items: ["Ancient Staff"],
    elements: ["darkness"],
    tonics: [],
    classes: []
  },
  topN: 30
});
```

## 3. Remove из blacklist

```js
blacklistHelpers.remove(blacklist, "items", "Ancient Staff");
blacklistHelpers.remove(blacklist, "elements", "darkness");
```
