# Релиз 12 — Исправления адаптивности, анимации и полиш UX

## 🆕 Новые возможности

### Анимированные счётчики (AnimatedNumber) в модуле Списки

**Описание:**  
Создан shared-компонент `AnimatedNumber` и хук `useCountAnimation` (extracted из stories-automation). Применён ко ВСЕМ числовым показателям в модуле Списки: дашборд статистики, карточки списков, статистика постов. Анимация easeOutExpo (1500ms), поддержка перехода от старого значения к новому (не с нуля).

**Реализация:**  
- `shared/hooks/useCountAnimation.tsx` — новый файл, экспортирует `useCountAnimation` и `AnimatedNumber`
- Props: value, duration (1500ms), delay, suffix, prefix, decimals, className, format (toLocaleString)
- easeOutExpo: `1 - Math.pow(2, -10 * progress)`, requestAnimationFrame 60fps
- Переход от текущего к новому через displayedValueRef, prevTargetRef

**Файл(ы):** `shared/hooks/useCountAnimation.tsx`, `features/lists/components/statistics/UserStatsComponents.tsx`, `features/lists/components/statistics/sections/UserStatsCards.tsx`, `features/lists/components/ListCard.tsx`, `features/lists/components/statistics/PostsStatsComponents.tsx`

---

### Анимации графиков SVG (Chart, PieChart, Bar)

**Описание:**  
Добавлены плавные анимации для всех типов графиков в модуле Списки:

1. **Line Chart** — `AnimatedPolyline` компонент: линия «рисуется» слева направо через SVG stroke-dashoffset (1.2s ease-out). Область под линией — fade-in через CSS @keyframes chart-area-fade.
2. **Pie Chart** — scale(0.7)+rotate(-90deg) → scale(1)+rotate(-90deg) входная анимация (0.8s). Стаггер секторов: каждый следующий +100ms.
3. **Bar Chart** (AgeCard, BirthdayCard) — transition-all duration-[800ms] ease-out на высоте столбцов (было 300ms).
4. **ProgressBar** — transition-all duration-[800ms] ease-out на ширине заполнения.

**Реализация:**  
- AnimatedPolyline: ref → getTotalLength() → strokeDasharray/strokeDashoffset → double rAF → transition 1.2s
- CSS анимации в index.css: @keyframes chart-area-fade, @keyframes pie-spin-in, .animate-chart-area, .animate-pie-chart

**Файл(ы):** `features/lists/components/statistics/Chart.tsx`, `features/lists/components/statistics/PieChart.tsx`, `features/lists/components/statistics/sections/UserStatsCards.tsx`, `features/lists/components/statistics/UserStatsComponents.tsx`, `index.css`

---

### Обновление скиллов AI (дизайн-система + архитектура)

**Описание:**  
Обновлены AI-скиллы дизайн-системы и архитектурного ревью, чтобы новые модули сразу создавались с AnimatedNumber, анимациями графиков, без серых оверлеев.

**Реализация:**  
- `animations.md`: добавлены разделы 8.11 (SVG Chart Animations), 8.12 (Запрет оверлеев), упоминание shared AnimatedNumber, обновлён чеклист (+14 пунктов)
- `checklist.md`: пункт 13 расширен на 10 новых подпунктов
- `prohibitions.md`: запреты #23 (серый overlay), #24 (opacity-60), #25 (голые числа) + grep-паттерны
- `arch-review SKILL.md`: пункты #12 (React component optimization), #13 (Data transition UX) + 7 авто-триггеров
- `uiux-refactor SKILL.md`: обновлён C5 + маппинг

**Файл(ы):** `.agents/skills/uiux-refactor/references/animations.md`, `.agents/skills/uiux-refactor/references/checklist.md`, `.agents/skills/uiux-refactor/references/prohibitions.md`, `.agents/skills/uiux-refactor/SKILL.md`, `.agents/skills/arch-review/SKILL.md`

---

## 🔴 Открытые задачи

_(пока нет)_

## ✅ Решённые задачи

### Убран серый оверлей при переключении проектов в Списках

**Проблема:**  
При переключении проектов в модуле Списки на ~1 секунду появлялся полупрозрачный серый оверлей поверх дашборда и таблиц, создавая ощущение «тормозящего» интерфейса.

**Причина:**  
ListsDataView.tsx содержал div с `bg-white/60 absolute inset-0 flex items-center justify-center` + спиннер, UserStatsView.tsx применял `opacity-60 pointer-events-none` на контейнер при isLoading.

**Решение:**  
Удалён overlay div из ListsDataView.tsx, убрана классы opacity-60 из UserStatsView.tsx. Теперь данные заменяются «тихо» — старые данные видны до прихода новых, AnimatedNumber анимирует переход чисел. Дополнительно исправлен импорт в UserStatsView.tsx (лишний `../` в пути к lists.api).

**Файл(ы):** `features/lists/components/sections/ListsDataView.tsx`, `features/lists/components/statistics/UserStatsView.tsx`

---

### Правая инфо-панель «Шаблоны» — выезд за границы экрана и отсутствие адаптивности

**Проблема:** При открытии вкладки «Шаблоны» в правой инфо-панели модуля Сообщения интерфейс выходил за границы viewport на экранах ≤1366px. Контент обрезался, вкладки (Профиль/Посты/Вложения/Шаблоны/Промокоды) не помещались в строку, шаблонные карточки были частично невидимы. Другие вкладки (Профиль, Посты, Вложения) отображались корректно.

**Причина:** Комплексная — 4 взаимосвязанных CSS-проблемы в layout-цепочке:

1. **`flex-shrink-0` на чат-контейнере** (MessagesPage.tsx, строка 183): Чат (`w-1/2 flex-shrink-0`) не мог сжиматься при нехватке ширины → правая панель (`flex-1`) получала остаток < 300px.
2. **Отсутствие `min-w-0`** на flex-контейнерах: Без `min-w-0` flex-дочерние элементы не могут сжиматься меньше `min-content`, текст и карточки выходили за границы.
3. **Строка вкладок без `overflow-x-auto`** (UserInfoPanel.tsx): 5 кнопок с `gap-4` и `text-sm` не помещались в узкой правой панели — вытекали за границы без скролла.
4. **`overflow-hidden` обрезал контент** без `overflow-x-hidden` на контейнере содержимого — горизонтальный overflow от карточек шаблонов не блокировался.

Дополнительный фактор (не основная причина): CDN Tailwind (`<script src="https://cdn.tailwindcss.com">` в index.html) мог конфликтовать с build-time Tailwind.

**Решение:** 

Итеративный фикс в 4 этапа:

**Этап 1-3 (предшествующие попытки):**
- Удаление двойного `overflow-y-auto`, добавление `flex-shrink-0` на header/tabs
- `min-h-0 overflow-hidden` на MessagesPage
- Замена обёртки TemplatesTab с `<div className="flex-1 flex-col overflow-hidden">` на Fragment `<>` (как ProfileTab)

**Этап 4 (финальный фикс):**

1. **MessagesPage.tsx** — чат-контейнер: убран `flex-shrink-0`, добавлен `min-w-0 flex-shrink` в развёрнутом режиме → чат ужимается при дефиците ширины. Правая панель: добавлен `min-w-0`.

2. **UserInfoPanel.tsx** — корневой div: `min-w-0`. Строка вкладок: `overflow-x-auto` + `flex-nowrap`. Кнопки вкладок: `text-xs px-1.5 whitespace-nowrap flex-shrink-0` (компактнее, не переносятся, скроллируются). Контейнер контента: `overflow-x-hidden`.

**Файл(ы):** `features/messages/components/MessagesPage.tsx`, `features/messages/components/user-info/UserInfoPanel.tsx`, `features/messages/components/templates/TemplatesTab.tsx`

**Верификация:** Playwright — 1366x768, 1280x720, 1024x768. Все разрешения: интерфейс помещается во viewport, шаблоны видны и функциональны, вкладки скроллируются горизонтально.
