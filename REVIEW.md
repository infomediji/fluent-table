# FluentTable — Code Review

Контекст: PHP 8.1+ / vanilla JS / Tabler UI / Composer-пакет без фреймворка.
Дата: 2026-03-04

---

## Раунд 1–2: Находки и фиксы (41 исправлено)

<details>
<summary>Полный список из раундов 1–2 (кликни чтобы развернуть)</summary>

### 1. Архитектор бэкенда (PHP)

| # | Уровень | Проблема | Статус |
|---|---------|----------|--------|
| 1.1 | CRITICAL | `Table.php` — `mkdir()` без проверки результата | ✅ Fixed |
| 1.2 | CRITICAL | `Table.php` — TOCTOU race + `copy()` без проверки | ✅ Fixed (atomic copy) |
| 1.3 | CRITICAL | `Table.php` — `json_encode` без HEX-флагов | ✅ Fixed |
| 1.4 | CRITICAL | `Column.php` — `array_filter` ненадёжно для `false` | ⏭ Skipped (корректно) |
| 1.5 | WARNING | Asset publishing внутри `render()` | 🔮 TODO |
| 1.6 | WARNING | `pageSizes()` не валидирует | ✅ Fixed |
| 1.7 | WARNING | `defaultSort()` не валидирует `$col` | ✅ Fixed |
| 1.8 | WARNING | `resetState()` сбрасывает оба флага | ✅ Fixed (split) |
| 1.9 | WARNING | Cast-классы без `readonly` | ⏭ Skipped |
| 1.10 | SUGGESTION | `with()` и PHP 9 | 🔮 TODO |
| 1.11 | SUGGESTION | Asset URL захардкожен | 🔮 TODO |
| 1.12 | SUGGESTION | `SelectCast` нет валидации options | 🔮 TODO |

### 2. Фронтенд-безопасник (JS/Security)

| # | Уровень | Проблема | Статус |
|---|---------|----------|--------|
| 2.1 | CRITICAL | Action URL без фильтрации протокола | ✅ Fixed |
| 2.2 | CRITICAL | `image` renderer без `safeUrl()` | ✅ Fixed |
| 2.3 | CRITICAL | `select/checkbox/datepicker` без `safeUrl()` | ✅ Fixed |
| 2.4 | WARNING | `safeUrl()` blocklist → allowlist | ✅ Fixed |
| 2.5 | WARNING | `optionsFrom` CSRF без `isSameOrigin()` | ✅ Fixed |
| 2.6 | WARNING | CSRF-токен кеш навсегда | ✅ Fixed |
| 2.7 | WARNING | Entity avatar `url()` без кавычек | ✅ Fixed |
| 2.8 | WARNING | `JSON.parse` без try/catch | ✅ Fixed |
| 2.9 | MAYBE | Custom event без валидации tableId | ⏭ Skipped |

### 3. CSS/UX/Accessibility

| # | Уровень | Проблема | Статус |
|---|---------|----------|--------|
| 3.1 | CRITICAL | `<table>` без accessible name | ✅ Fixed |
| 3.2 | CRITICAL | Status dot без `aria-hidden` | ✅ Fixed |
| 3.3 | CRITICAL | Icon-only button без `aria-label` | ✅ Fixed |
| 3.4 | CRITICAL | `window.confirm()` → custom modal | 🔮 TODO |
| 3.5 | CRITICAL | Expandable rows без keyboard access | ✅ Fixed |
| 3.6 | CRITICAL | Loading: aria-live не работает | ✅ Fixed |
| 3.7 | CRITICAL | `prefers-reduced-motion` не останавливает | ✅ Fixed |
| 3.8 | WARNING | `aria-sort` не выставляется при init | ✅ Already OK |
| 3.9 | WARNING | `aria-live` на `d-none` элементе | ✅ Fixed |
| 3.10 | WARNING | `<select>` без `aria-label` | ✅ Fixed |
| 3.11 | WARNING | Datepicker без `aria-label` | ✅ Fixed |
| 3.12 | WARNING | Checkbox без `aria-label` | ✅ Fixed |
| 3.13 | WARNING | Per-page dropdown неоднозначно | ⏭ Skipped |
| 3.14 | WARNING | Remote filters `<a>` → `<button>` | ✅ Fixed |
| 3.15 | WARNING | Action icon без `aria-hidden` | ✅ Fixed |
| 3.16 | WARNING | Pagination ellipsis без `aria-hidden` | ✅ Fixed |
| 3.17 | WARNING | Pagination `<ul>` без `aria-label` | ✅ Fixed |
| 3.18 | WARNING | tbody replace без focus management | ✅ Fixed |
| 3.19 | WARNING | `.flt-sort` без `:focus-visible` | ✅ Fixed |
| 3.20 | WARNING | Status dot color-only, dark mode | ⏭ Skipped |
| 3.21 | SUGGESTION | Expand button без `aria-controls` | 🔮 TODO |
| 3.22 | SUGGESTION | SVG иконки без `aria-hidden` | ✅ Fixed |
| 3.23 | SUGGESTION | Image `alt` не resolvable | ⏭ Skipped |

### 4. Тестировщик

| # | Уровень | Проблема | Статус |
|---|---------|----------|--------|
| 4.1 | CRITICAL | Static state между тестами | 🔮 TODO (DI) |
| 4.2 | CRITICAL | Filesystem I/O внутри render() | 🔮 TODO |
| 4.3 | CRITICAL | `PUBLIC_HTML_PATH` не injectable | 🔮 TODO |
| 4.4 | CRITICAL | `buildConfig()` private | 🔮 TODO |
| 4.5 | WARNING | `csrfTokenCache` между тестами | ✅ Fixed |
| 4.6 | WARNING | `instances` Map | ⏭ Skipped |
| 4.7–4.12 | WARNING | Injectable config options | 🔮 TODO |
| 4.13 | SUGGESTION | `buildConfig()` public | 🔮 TODO |
| 4.14 | SUGGESTION | `renderers` mutable | ⏭ Skipped |

### 5. Интеграционщик (PHP ↔ JS)

| # | Уровень | Проблема | Статус |
|---|---------|----------|--------|
| 5.1 | CRITICAL | Race condition FluentTableReady | ⏭ Skipped |
| 5.2 | CRITICAL | localStorage key по endpoint | ✅ Fixed |
| 5.3 | CRITICAL | `resetState()` split | ✅ Fixed |
| 5.4 | CRITICAL | `renderError()` colspan | ✅ Fixed |
| 5.5 | WARNING | `json_encode` флаги | ✅ Fixed |
| 5.6 | WARNING | `formatDate()` первое вхождение | ✅ Fixed |
| 5.7 | WARNING | Asset tags без CSP/SRI | 🔮 TODO |
| 5.8 | WARNING | Pagination fallback | ✅ Fixed |
| 5.9 | WARNING | AirDatepicker selectedDates | ✅ Fixed |
| 5.10 | WARNING | `btn-0` не существует | ✅ Fixed |
| 5.11 | WARNING | Exception из publishAssets() | ⏭ Skipped |
| 5.12 | SUGGESTION | Error response контракт | 🔮 TODO |
| 5.13 | SUGGESTION | URL search param auto-increment | 🔮 TODO |
| 5.14 | SUGGESTION | `button-group` дропает types | ⏭ Skipped |

</details>

---

## Раунд 3: Повторное ревью после фиксов

Ревью проведено 2026-03-04 после применения 41 фикса. Найдены проблемы, внесённые фиксами, и ранее незамеченные баги.

### Надо фиксить

| # | Уровень | Файл:строка | Проблема | Детали |
|---|---------|-------------|----------|--------|
| R1 | **HIGH** | `table.js:54` | `safeUrl()` пропускает `//evil.com` | Protocol-relative URL начинается с `/`, проходит `^[\/\.]` ветку allowlist. Open redirect / phishing. Фикс: `^\/[^\/]` или явная проверка `^\/\/`. |
| R2 | **HIGH** | `table.js:425` | Entity avatar — CSS injection через `"` в URL | `escAttr` кодирует `"` → `&amp;quot;`, но HTML-парсер декодирует обратно до CSS-парсера. URL вида `x");color:red;x:url("y` ломает `url()` контекст. Фикс: percent-encode `"` и `'` в URL перед вставкой в style, или strip эти символы. |
| R3 | **HIGH** | `Table.php:350` | `rename()` без проверки результата | При failure: temp-файл остаётся, dest не появляется, но `$assetsPublished = true` навсегда. Фикс: `if (!rename(...)) { @unlink($tmp); throw ... }`. |
| R4 | **HIGH** | `Table.php:340-350` | `unlink()` старых файлов до подтверждения нового | Если `copy()`/`rename()` фейлится после `unlink()` — нет ни старого, ни нового файла. Фикс: переместить `unlink` после успешного `rename`. |
| R5 | **MEDIUM** | `Table.php:161` | `action()` — `//evil.com` обходит scheme-guard | `parse_url('//evil.com')` не возвращает `scheme`, guard пропускает. Open redirect. Фикс: проверять `isset($parsed['host'])` при отсутствии scheme. |
| R6 | **MEDIUM** | `Table.php:161` | `action()` — `parse_url()` возвращает `false` | На malformed URL `parse_url()` возвращает `false`, `isset(false['scheme'])` → false, URL принимается. Фикс: `if ($parsed === false) throw`. |
| R7 | **MEDIUM** | `table.php:134` | Sort `<button>` без `type="button"` | Если таблица внутри `<form>`, клик по sort-кнопке сабмитит форму (default type=submit). |
| R8 | **MEDIUM** | `table.php:115` | `aria-live` на overlay div, а не на text span | `aria-live="polite"` на контейнере loader вызывает двойной анонс при переключении `aria-busy`. Должен быть на `<span class="flt-loader-text">`. |

### Мелкие / low priority

| # | Уровень | Файл:строка | Проблема |
|---|---------|-------------|----------|
| R9 | LOW | `table.js:54` | URL вида `path/has:colon` ложно блокируется safeUrl (false positive) |
| R10 | LOW | `Table.php:367-378` | `resetInstanceCount()`/`resetAssets()` public — partial reset ломает инварианты, сделать private |
| R11 | LOW | `table.php:43` | Action `<a>` без `rel="noopener"` для внешних URL |
| R12 | LOW | `Table.php:345` | `@unlink($tmp)` подавляет ошибки — temp-файлы могут накапливаться |
| R13 | LOW | `table.js:611` | Focus restore: `dataset.fltRowIdx` может быть string `"undefined"` — guard `!= null` пропускает (безопасно, но семантически неверно) |

---

## Раунд 4: Ревью остальных файлов

Проревьюированы: `Column.php`, `Response.php`, `Color.php`, `ButtonStyle.php`, `Icon.php`, `AbstractCast.php`, `CastInterface.php` и все 24 конкретных cast-класса.

### Column.php

| # | Уровень | Проблема |
|---|---------|----------|
| C1 | **MEDIUM** | `setWidth()` — нет валидации формата CSS-значения. Принимает любую строку. |
| C2 | **MEDIUM** | `searchField` остаётся в `toArray()` когда `searchable=false` — orphaned key в JSON |
| C3 | LOW | `name` и `field` в конструкторе принимают пустую строку |
| C4 | LOW | `setSearchable(false, "")` — пустая строка как searchField |
| C5 | LOW | `setCast()` молча перезаписывает предыдущий cast |

### Response.php

| # | Уровень | Проблема |
|---|---------|----------|
| P1 | **MEDIUM** | `$total` может быть отрицательным — нет guard. `ceil(-1/20)` → 0, inconsistent output |
| P2 | LOW | `$page` за пределами totalPages не детектируется |
| P3 | LOW | `$data` тип `array` не enforce-ит `list<array>` из PHPDoc |

### Enum-ы (Color, ButtonStyle, Icon)

| # | Уровень | Проблема |
|---|---------|----------|
| E1 | LOW | `ButtonStyle.php` — отсутствуют `OutlineInfo` и `GhostInfo` для полноты серии |

### AbstractCast / CastInterface

| # | Уровень | Проблема |
|---|---------|----------|
| A1 | **MEDIUM** | `with()` — нет `property_exists()` guard. Опечатка в имени свойства = dynamic property (deprecation PHP 8.2, fatal PHP 9). PHPStan suppressed. |
| A2 | **MEDIUM** | `with()` — не работает с `readonly` свойствами (fatal при записи на clone). Если будущий cast добавит readonly + with() — crash. |
| A3 | LOW | `CheckboxCast::values()` вручную клонирует вместо `with()` — drift |
| A4 | LOW | `CastInterface` не объявляет `make()` — конвенция, не контракт |

### Interactive Casts (Button, Select, Checkbox, DatePicker, Link, Modal, Download)

| # | Уровень | Проблема |
|---|---------|----------|
| IC1 | **HIGH** | Все URL-содержащие касты (`ButtonCast`, `IconButtonCast`, `SelectCast`, `CheckboxCast`, `DatePickerCast`, `LinkCast`, `DownloadLinkCast`) — **нет валидации URL**. `javascript:`, `data:`, пустая строка проходят. JS-side `safeUrl()` ловит часть, но defense-in-depth отсутствует. |
| IC2 | **HIGH** | `SelectCast` — `options` и `optionsFrom` не mutually exclusive. Оба ключа могут быть в output одновременно, поведение JS не определено. |
| IC3 | **HIGH** | `ButtonGroupCast::make()` — можно сериализовать с 0 кнопок. JS получит пустой `buttons: []`. |
| IC4 | **MEDIUM** | `CheckboxCast::values(null, null)` — оба значения `null` → оба дропнутся из `toArray()`. JS не сможет различить checked/unchecked. |
| IC5 | **MEDIUM** | `DatePickerCast` — `minDate`/`maxDate` не валидируются как даты. Нет проверки `min < max`. |
| IC6 | **MEDIUM** | `DownloadLinkCast::make('')` — пустая строка не `null`, проходит `array_filter`, JS получает пустой URL. |
| IC7 | LOW | `ButtonCast`/`IconButtonCast` — `payload` typed `mixed`, closure/object вызовут JSON failure при render |
| IC8 | LOW | `ModalButtonCast`/`ModalIconButtonCast` — `target` не валидируется как CSS-селектор |

### Display Casts (Text, Badge, Date, Price, FileSize, Icon, Image, Tags, Status, Entity, Hidden)

| # | Уровень | Проблема |
|---|---------|----------|
| DC1 | **MEDIUM** | `DateCast::make('')` — пустой формат принимается, сломает JS date formatter |
| DC2 | **MEDIUM** | `DateCast` — флаг `withTime` и `format` могут противоречить друг другу (формат с временем, но флаг false) |
| DC3 | **MEDIUM** | `PriceCast::make('INVALID', 'not-a-locale')` — нет валидации currency/locale. `Intl.NumberFormat` в JS крашнется |
| DC4 | **MEDIUM** | `FileSizeCast::make(-1)` — отрицательный `decimals` вызовет `toFixed(-1)` → exception в JS |
| DC5 | **MEDIUM** | `EntityCast::make('')` — пустой title field, JS попытается `dig(row, '')` |
| DC6 | LOW | `BadgeCast`/`StatusCast` — пустой `$map` `[]` молча принимается |
| DC7 | LOW | `BadgeCast` vs `StatusCast` — `$default` nullable у Badge, не nullable у Status. Непоследовательность. |
| DC8 | LOW | `ImageCast` — `$width`/`$height` не валидируются как CSS-значения |
| DC9 | LOW | `TagsCast`/`ClickableTagsCast` — `$labelField`/`$valueField` пустая строка принимается |
| DC10 | LOW | `ClickableTagsCast` — нет проверки наличия `{value}` плейсхолдера в URL |
| DC11 | LOW | `IconCast::mapped([])` — пустой map, JS ничего не покажет |
| DC12 | LOW | `resolveEnum()` принимает произвольные строки без проверки что это валидное имя цвета/иконки |

### Сквозные проблемы

| # | Уровень | Проблема |
|---|---------|----------|
| X1 | **MEDIUM** | Ни один cast не валидирует URL на стороне PHP. Вся защита — `safeUrl()` на JS, у которой свои дыры (R1, R2). Нет defense-in-depth. |
| X2 | LOW | `resolveEnum()` silently passes arbitrary strings — нет проверки что строка является валидным Color/Icon value |
| X3 | LOW | `array_filter($v !== null)` корректен, но если кто-то пропустит callback в будущем — `false`/`0`/`""` пропадут. Паттерн хрупкий. |

---

## Сводная статистика

### Раунды 1–2

| Статус | Количество |
|--------|-----------|
| ✅ Fixed | 41 |
| ⏭ Skipped | 10 |
| 🔮 TODO (архитектурные) | 20 |

### Раунд 3 (повторное ревью основных файлов)

| Уровень | Количество |
|---------|-----------|
| HIGH | 4 |
| MEDIUM | 4 |
| LOW | 5 |

### Раунд 4 (остальные файлы)

| Уровень | Количество |
|---------|-----------|
| HIGH | 3 |
| MEDIUM | 13 |
| LOW | 18 |
