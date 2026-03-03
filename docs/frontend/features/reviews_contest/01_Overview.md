# Конкурс отзывов (Reviews Contest) — Frontend

## Обзор

Модуль `features/automations/reviews-contest` реализует интерфейс для автоматизации конкурсов отзывов — мониторинг комментариев, автоматическая регистрация участников, розыгрыш промокодов, отправка ЛС победителям.

## Расположение в интерфейсе

Автоматизации → Конкурс отзывов → выбор проекта в сайдбаре.

---

## Структура файлов

```
features/automations/reviews-contest/
├── ReviewsContestPage.tsx              # Главная страница модуля
├── types.ts                            # TypeScript типы (ContestSettings и др.)
├── hooks/                              # Бизнес-логика
│   ├── useContestSettings.ts           # Настройки конкурса
│   └── usePromocodesManager.ts         # Управление промокодами
└── components/
    ├── SettingsTab.tsx                  # Вкладка «Настройки»
    ├── PromocodesTab.tsx               # Вкладка «Промокоды»
    ├── ParticipantsTab.tsx             # Вкладка «Участники»
    ├── WinnersTab.tsx                  # Вкладка «Победители»
    ├── LogsTab.tsx                     # Вкладка «Логи»
    ├── BlacklistTab.tsx                # Вкладка «Чёрный список»
    ├── PostsTab.tsx                    # Вкладка «Посты»
    ├── SendingListTab.tsx              # Вкладка «Рассылка»
    ├── modals/                         # Модальные окна
    ├── preview/                        # Предпросмотр
    ├── promocodes/                     # Компоненты промокодов
    └── settings/                       # Компоненты настроек
        ├── MainSettings.tsx            # Основные настройки конкурса
        ├── FinishConditions.tsx         # Условия завершения
        ├── TemplatesSection.tsx         # Секция шаблонов сообщений
        └── controls/
            ├── FormControls.tsx         # Формы (поля, селекты)
            └── RichTemplateEditor.tsx   # Текстовый редактор шаблонов ⭐
```

---

## Ключевые компоненты

### `ReviewsContestPage`

**Назначение:** Корневой компонент модуля — управляет вкладками и передаёт `projectId`.

### `TemplatesSection`

**Назначение:** Секция «Шаблоны сообщений» на вкладке настроек. Рендерит 4 экземпляра `RichTemplateEditor`:

| Шаблон | Частные переменные | Описание |
|---|---|---|
| Комментарий регистрации | `{number}` | Автоответ под публикацией с ключевым словом |
| ЛС победителю | `{promo_code}`, `{description}`, `{user_name}` | Личное сообщение с промокодом |
| Ошибка отправки | `{user_name}` | Комментарий, если ЛС не отправилось |
| Пост с итогами | `{winners_list}` | Текст итогового поста |

Каждый экземпляр получает свой набор `specificVariables` — частных переменных, уникальных для этого поля.

---

### `RichTemplateEditor` ⭐

Подробная документация: [02_RichTemplateEditor.md](02_RichTemplateEditor.md)

---

## Типы

```typescript
// types.ts
interface ContestSettings {
    templateComment: string;     // Шаблон комментария регистрации
    templateDm: string;          // Шаблон ЛС победителю
    templateError: string;       // Шаблон ошибки отправки
    templateResults: string;     // Шаблон поста с итогами
    keywords: string;            // Ключевые слова для мониторинга
    finishCondition: 'count' | 'date' | 'combined';
    targetCount: number;
    finishDayOfWeek: number;
    finishTime: string;
    // ...
}
```

---

## См. также

- [RichTemplateEditor](02_RichTemplateEditor.md) — текстовый редактор шаблонов
- [Backend: Contest V2](../../backend/features/contest_v2/) — бэкенд конкурсов
- [UI-Kit: Дизайн-система](../../ui-kit/) — правила оформления
