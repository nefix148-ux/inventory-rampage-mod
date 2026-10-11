# Как пересобрать APK с модификациями

## Что нужно

- APK Inventory Rampager
- Android SDK build-tools **или** uber-apk-signer / apksigner
- Для нас достаточно unzip/zip (меняем только assets)

## Шаги

### 1. Распаковать

```bash
mkdir rampage_mod && cd rampage_mod
unzip -q /path/to/original.apk
```

### 2. Заменить воркер

```bash
cp src/find-good-set.worker.clean.js assets/public/assets/find-good-set.worker-j8prte2u.js
```

### 3. Добавить UI-панель

```bash
cp src/find-set-ui-overlay.js assets/public/assets/find-set-ui-overlay.js
```

В `assets/public/index.html` перед `</body>`:

```html
<script src="./assets/find-set-ui-overlay.js"></script>
```

### 4. Запаковать

```bash
rm -rf META-INF
zip -r -9 ../InventoryRampager-mod.apk .
```

### 5. Подписать

```bash
java -jar uber-apk-signer.jar -a InventoryRampager-mod.apk
# или apksigner sign --ks my.keystore --out signed.apk InventoryRampager-mod.apk
```

### 6. Установить

```bash
adb install -r InventoryRampager-mod-aligned-debugSigned.apk
```

## Проверка

1. Открыть приложение → нажать «Крысу»
2. Должна появиться панель фильтров (или `IRFindSetUI.open()` в консоли)
3. Добавить в blacklist / выставить диапазон → сохранить
4. Запустить поиск
