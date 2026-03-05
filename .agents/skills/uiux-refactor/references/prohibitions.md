# Общие запреты

Сводная таблица всего, что **ЗАПРЕЩЕНО** в интерфейсе. Использовать как быстрый справочник при аудите.

## Запреты

| # | Запрет | Правильная альтернатива | Пункт чеклиста |
|---|---|---|---|
| 1 | `window.confirm()` / `confirm()` | `ConfirmationModal` через `useState` | 6 — Уведомления |
| 2 | `window.alert()` / `alert()` | `toastBridge.success()` / `showAppToast()` | 6 — Уведомления |
| 3 | `window.prompt()` / `prompt()` | Инпут в модальном окне | 6 — Уведомления |
| 4 | Эмоджи как кнопки (🗑️ ✏️ 📋  👁️) | SVG-иконки `h-5 w-5` с `title` | 7 — Иконки |
| 5 | Raw hex/rgb в `className` (`#3B82F6`) | Tailwind-классы (`bg-indigo-600`) | 9 — Цвета |
| 6 | Inline `style={{ color: '#...' }}` без причины | Tailwind-классы | 9 — Цвета |
| 7 | `<img>` без skeleton + fade-in | Паттерн `useState(false)` → `onLoad` | 8 — Изображения |
| 8 | Некликабельные фото | Обёртка в `<button>` → lightbox | 8 — Изображения |
| 9 | `overflow-y-scroll` без `custom-scrollbar` | Добавить `custom-scrollbar` | 1 — Скроллбары |
| 10 | `scrollbar-thin` (устаревший класс) | `custom-scrollbar` | 1 — Скроллбары |
| 11 | Формат `"Текст (Число)"` для счётчиков | `"Текст - Число"` (через тире) | 5 — Счётчики |
| 12 | Rounded/pill табы (`rounded-full bg-...`) | Underline табы (`border-b-2`) | 4 — Табы |
| 13 | `bg-blue-500/600` для primary-кнопок | `bg-green-600` для сохранения | 2 — Кнопки |
| 14 | `rounded-lg` / `rounded-xl` на кнопках | `rounded-md` | 2 — Кнопки |
| 15 | Тумблер без `shrink-0` в flex | Добавить `shrink-0` | 3 — Тумблеры |
| 16 | Тумблер с `bg-green-500` / `bg-blue-600` | `bg-indigo-600` | 3 — Тумблеры |
| 17 | Кнопка «Обновить» перезагружает весь блок/модуль (спиннер заменяет контент) | Мягкое обновление: данные обновляются in-place, кнопка крутит иконку, контент остаётся видимым. Спиннер — только при первичной загрузке (`isLoading && !data`) | 10 — Обновление данных |
| 18 | Несуществующие Tailwind half-step классы: `w-4.5`, `h-4.5`, `w-5.5`, `h-5.5`, `p-4.5`, `m-4.5`, `gap-4.5` и любые `.5` шаги после `3.5` | Half-step шкала Tailwind заканчивается на `3.5`. Допустимые: `0.5, 1.5, 2.5, 3.5`. После `3.5` → целые числа: `4, 5, 6, 7, 8...` | 19 — Tailwind spacing |
| 19 | `absolute` элемент, выступающий за границы родителя с `overflow-auto/hidden/scroll` | Либо: (а) убрать `overflow-*` / поставить `overflow-visible`, (б) вложить элемент ВНУТРЬ границ (без `negative top/right`), (в) рендерить через `createPortal` | 20 — Overflow+absolute |
| 20 | Точечный фикс: исправление только упомянутого вхождения без grep по файлу на аналогичные | После ЛЮБОГО исправления — grep по всему файлу на тот же паттерн. Если исправил `w-4.5`→`w-5` в одном месте, найди ВСЕ `w-4.5` в файле | 21 — Полнота фикса |
| 21 | `onBlur={handleSave}` на input, рядом с которым есть кнопки (палитра цветов, иконки) | `onBlur` ДОЛЖЕН проверять `e.relatedTarget`: `onBlur={e => { if (container.contains(e.relatedTarget)) return; save(); }}` | 22 — Blur race condition |
| 22 | Радикальная смена layout-модели вместо минимального фикса (scroll→wrap, flex→grid) | Предпочитать изменение 1-2 CSS-свойств. Не переписывать layout целиком для исправления точечного бага | 23 — Минимальный diff |
| 23 | Серый overlay `bg-white/60` или `bg-black/20` поверх контента при обновлении данных | Данные заменяются «тихо»: старые значения видны до прихода новых, AnimatedNumber анимирует переход. Оверлей — только в модалках/попапах | 13 — Анимации |
| 24 | `opacity-60` / `pointer-events-none` на контейнере при isLoading | Контейнер всегда `opacity-100`. Числа анимируются через AnimatedNumber. Скелетон — только при ПЕРВОЙ загрузке (данных нет вообще) | 13 — Анимации |
| 25 | Голые числа `{stats.total}` или `{count.toLocaleString()}` в дашбордах и карточках | `<AnimatedNumber value={stats.total} />` или `<AnimatedNumber value={count} format />` из `shared/hooks/useCountAnimation.tsx` | 13 — Анимации |

> **Запреты 23–25 (SVG performance)** перенесены в скилл **`arch-review`** (пункт #11 чеклиста, reference: `svg_chart_performance.md`). Это проверки производительности, а не визуального соответствия дизайн-системе.

## Как использовать при аудите

Для каждого запрета — поискать в коде проверяемой области:

```
# grep-паттерны для поиска нарушений
confirm(          → запрет 1
alert(            → запрет 2
prompt(           → запрет 3
>🗑️<  >✏️<  >📋<  >👁️<  → запрет 4
#[0-9A-Fa-f]      → запрет 5
style={{           → запрет 6 (проверить содержимое)
<img.*className    → запрет 7 (проверить наличие onLoad)
overflow-y-scroll  → запрет 9
scrollbar-thin     → запрет 10
({count})          → запрет 11
rounded-full.*bg-  → запрет 12 (в контексте табов)
bg-blue-           → запрет 13
rounded-lg         → запрет 14 (в контексте кнопок)
onRefresh.*setIsLoading(true)  → запрет 17 (проверить что refresh не ставит isLoading=true)
w-4\.5|h-4\.5|w-5\.5|h-5\.5|p-4\.5|m-4\.5|gap-4\.5  → запрет 18 (несуществующие классы)
absolute.*-top-|-right-|-bottom-|-left-  → запрет 19 (проверить overflow предков)
onBlur={handle     → запрет 21 (проверить наличие relatedTarget guard)
bg-white/60|bg-white/50|bg-black/20  → запрет 23 (серый overlay при загрузке)
opacity-60.*isLoading|isLoading.*opacity  → запрет 24 (dimming при загрузке)
{stats\.|{count\.|\.toLocaleString  → запрет 25 (проверить обёрнуто ли в AnimatedNumber)
# SVG performance (26-28) — проверяется скиллом arch-review (пункт #11)
```
