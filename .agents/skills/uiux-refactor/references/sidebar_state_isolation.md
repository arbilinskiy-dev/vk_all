````markdown
# Сайдбар — Изоляция состояний вкладок

**Правило:** Каждый раздел (вкладка/модуль) PrimarySidebar ОБЯЗАН иметь **изолированные состояния**. Состояние одной вкладки НЕ ДОЛЖНО «просачиваться» в другую. Состояния МОЖНО переиспользовать между разделами через явный импорт, но ЗАПРЕЩЕНО случайное пересечение.

## Архитектура PrimarySidebar

```
┌────────────────────────────────────────────────────────────┐
│ PrimarySidebar (двухколоночный)                            │
│                                                            │
│ Колонка 1 (w-16)      Колонка 2 (w-40, выдвижная)         │
│ ┌──────────┐           ┌──────────────────────────┐        │
│ │ Модули:  │           │ Подменю (если модуль     │        │
│ │ km       │─────────► │ km / lists / am)         │        │
│ │ lists    │           │                          │        │
│ │ am       │           │ У каждого модуля свои    │        │
│ │ stats    │           │ изолированные вкладки    │        │
│ ├──────────┤           └──────────────────────────┘        │
│ │Глобальные│                                               │
│ │ views    │                                               │
│ └──────────┘                                               │
└────────────────────────────────────────────────────────────┘
```

### Вкладки и их разделы

| Модуль | `AppModule` | Подвкладки | Изолированные состояния |
|---|---|---|---|
| Контент-менеджмент | `'km'` | schedule, suggested, products, automations-* | Посты, фильтры, счётчики постов, параметры автоматизаций |
| Списки | `'lists'` | lists-system, lists-user, lists-automations | activeListGroup, фильтры списков |
| Сообщения | `'am'` | messages-vk, messages-tg, messages-stats | conversationId, unreadCount, типирование, фильтр непрочитанных |
| Глобальные | `null` | settings, training, sandbox, db-management, user-management, updates | Собственные стейты каждого Page-компонента |

## Правила изоляции

### 1. Каждый модуль — свой скоуп состояний

```
❌ ЗАПРЕЩЕНО — состояние сообщений доступно в контент-вкладке:

// App.tsx
const { unreadCount } = useConversations(); // Состояние модуля am
// ... передаётся в km-компонент
<ScheduleTab unreadCount={unreadCount} />  // Утечка!


✅ ПРАВИЛЬНО — счётчик сообщений используется ТОЛЬКО в модуле am:

// Счётчик непрочитанных отображается:
// 1. На иконке модуля am в PrimarySidebar (badge)
// 2. Внутри ConversationsSidebar (фильтрация)
// 3. Внутри MessagesPage (заголовок)
// НЕ передаётся в km, lists или глобальные виды
```

### 2. Явное разделение колбэков навигации

Каждый модуль имеет **свой** колбэк навигации:

| Модуль | Колбэк | Что делает |
|---|---|---|
| km | `onSelectView(view)` | Переключает вкладку внутри km |
| lists | `onSelectListsView(view)` | Переключает + синхронизирует `activeListGroup` |
| am | `onSelectMessagesView(view)` | Переключает вкладку внутри am |
| Глобальные | `onSelectGlobalView(view)` | Устанавливает `activeModule = null` |

### 3. Сброс состояний при смене модуля

При переключении `activeModule` (клик по иконке в PrimarySidebar) ОБЯЗАТЕЛЬНО:
- Сбросить `activeViewParams` до `{}`
- НЕ сбрасывать состояния других модулей (они сохраняются для возврата)
- Каждый модуль-компонент хранит свои стейты внутри себя

### 4. Сброс при смене проекта

При смене `activeProjectId`:
- Сбросить `conversationFilterUnread` → `'all'`
- Сбросить `activeConversationId` → `null`
- Сбросить `activeViewParams` → `{}`
- Компоненты с `key={activeProject?.id}` пересоздаются и теряют свои стейты — это **ожидаемое поведение**

### 5. Допустимое переиспользование состояний

Состояния МОЖНО переиспользовать, если это **явно и осознанно**:

| Состояние | Где определено | Где переиспользуется | Почему допустимо |
|---|---|---|---|
| `activeProjectId` | `useAppState` | km, lists, am | Глобальный контекст — проект выбран для всех модулей |
| `navigationBlocker` | `App.tsx` | Любой Page с формой | Защита от потери данных — кросс-модульная по дизайну |
| `storiesActiveTab` | `AppContent` | `StoriesAutomationPage` | Сохранение вкладки при смене проекта — явно задокументировано |

## Типичные ошибки (антипаттерны)

### Ошибка 1: Счётчик сообщений в контент-вкладке

```tsx
// ❌ ПЛОХО — unreadDialogCounts просачивается в Sidebar проектов
<Sidebar
  unreadDialogCounts={unreadDialogCounts}  // Это состояние am!
  ...
/>
```

> Если Sidebar проектов показывает индикатор непрочитанных — он должен получать **только булевый флаг** `hasUnread`, а не весь объект счётчиков. И только если этот индикатор архитектурно предусмотрен для конкретной вкладки.

### Ошибка 2: activeViewParams не сбрасывается

```tsx
// ❌ ПЛОХО — старые params от конкурсов видны в товарах
handleSelectKmView('products'); // activeViewParams всё ещё { contestId: '123' }

// ✅ ПРАВИЛЬНО — сбрасывать params при смене вкладки
handleSelectKmView('products');
setActiveViewParams({}); // Явный сброс
```

### Ошибка 3: Глобальный стейт вместо локального

```tsx
// ❌ ПЛОХО — фильтр хранится в App.tsx, хотя используется только в одном компоненте
const [productFilter, setProductFilter] = useState('all'); // в App.tsx
<ProductsTab filter={productFilter} onFilterChange={setProductFilter} />

// ✅ ПРАВИЛЬНО — фильтр внутри компонента
// ProductsTab.tsx
const [filter, setFilter] = useState('all'); // Локальный стейт
```

### Ошибка 4: Shared-хук без понимания скоупа

```tsx
// ❌ ПЛОХО — хук useUnreadDialogCounts вызван в компоненте km
// features/posts/components/PostsList.tsx
const { unreadCounts } = useUnreadDialogCounts(); // Зачем постам счётчик сообщений?

// ✅ ПРАВИЛЬНО — хук вызывается только в скоупе модуля am
// features/messages/components/ConversationsSidebar.tsx
const { unreadCounts } = useUnreadDialogCounts(); // Тут контекст правильный
```

## Известные допустимые исключения

1. **`storiesActiveTab`** — хранится в `AppContent`, а не в `StoriesAutomationPage`, чтобы сохраняться при смене проекта (компонент пересоздаётся через `key={projectId}`). Задокументировано в коде.

2. **`navigationBlocker`** — кросс-модульный по дизайну. Работает как глобальный guard для несохранённых данных. **Известный TODO:** блокировщик не проверяется при смене модуля (km → lists), только при смене проекта.

3. **`activeProjectId`** — глобальный по определению, используется всеми модулями.

## Чеклист при аудите

- [ ] Каждый модуль (`km`, `lists`, `am`) хранит свои стейты **внутри своих компонентов**, а не в `App.tsx`
- [ ] Состояния модуля `am` (unreadCounts, conversations, typing) НЕ передаются в компоненты `km` или `lists`
- [ ] Состояния модуля `km` (postFilters, scheduleData) НЕ передаются в компоненты `am` или `lists`
- [ ] `activeViewParams` сбрасывается при смене вкладки внутри модуля
- [ ] `activeListGroup` корректно синхронизируется для всех вкладок `lists-*`
- [ ] Нет вызовов хуков модуля `am` (useConversations, useUnreadDialogCounts) в компонентах `km`/`lists`
- [ ] Нет вызовов хуков модуля `km` (usePosts, useSchedule) в компонентах `am`/`lists`
- [ ] Переиспользуемые состояния (`activeProjectId`, `navigationBlocker`) явно задокументированы
- [ ] При смене модуля (`activeModule`) не происходит сброс стейтов других модулей
- [ ] При смене проекта сбрасываются: `conversationFilterUnread`, `activeConversationId`, `activeViewParams`
````
