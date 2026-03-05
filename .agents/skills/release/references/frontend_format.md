# Frontend Format — Формат данных страницы «История изменений»

## Расположение файлов

```
features/updates/data/
  updatesData.ts      ← Интерфейсы + массив updatesData[] (НЕ инлайнить данные, кроме release 1)
  release2Data.ts     ← export const release2Data: ReleaseUpdate = { ... }
  release3Data.ts
  release4Data.ts
  ...
```

## Интерфейсы (из updatesData.ts)

```typescript
export type ImpactType = 'visual' | 'logic' | 'both';

export interface KnownIssue {
    description: string;
    reason: string;
    workaround?: string;
}

export interface UpdateEntry {
    id: string;                          // Уникальный slug (напр. 'bulk-edit')
    type: 'bugfix' | 'feature' | 'improvement';
    section?: string;                    // Раздел приложения
    impactType?: ImpactType;
    title: string;
    userDescription: string;
    userSolution: string;
    userInstructions?: string[];         // Для фич — пошаговые инструкции
    userBenefits?: string;               // Для фич — что теперь можно
    knownIssues?: KnownIssue[];
    technicalDetails?: string;           // Сворачиваемый блок
}

export interface ReleaseUpdate {
    date: string;                        // 'ДД.ММ.ГГГГ' для published, 'хх.хх.хххх' для in-progress
    summary: string;
    status: 'published' | 'in-progress';
    entries: UpdateEntry[];
}
```

## Создание файла нового релиза

```typescript
// features/updates/data/releaseXData.ts
import { ReleaseUpdate } from './updatesData';

export const releaseXData: ReleaseUpdate = {
    date: 'хх.хх.хххх',        // Для нового релиза — ВСЕГДА 'хх.хх.хххх'. Дата выставляется автоматически при деплое фронтенда
    summary: 'Краткое описание релиза одной строкой',
    status: 'in-progress',       // При финализации → 'published' (дата заполняется при деплое)
    entries: [
        {
            id: 'уникальный-slug',
            type: 'feature',           // или 'bugfix', 'improvement'
            section: 'Контент — Посты',
            impactType: 'both',
            title: 'Заголовок',
            userDescription: 'Что было / что добавили (простой язык)',
            userSolution: 'Что сделали / как решили (простой язык)',
            userInstructions: ['Шаг 1', 'Шаг 2'],  // только для feature
            userBenefits: 'Что теперь можно',        // только для feature
            technicalDetails: 'Технические детали из releaseX.md',
        },
    ],
};
```

## Подключение в updatesData.ts

```typescript
import { releaseXData } from './releaseXData';
// ... существующие импорты

export const updatesData: ReleaseUpdate[] = [
    releaseXData,    // ← НОВЫЙ — всегда первый
    release4Data,
    release3Data,
    release2Data,
    { /* inline release 1 */ },
];
```

## Стандартные значения section

| Значение | Когда |
|---|---|
| `Контент — Посты` | Создание, редактирование, удаление постов |
| `Контент — Расписание` | Отложенные записи, публикация по расписанию |
| `Контент — Товары` | Карточки товаров, подборки, импорт/экспорт |
| `Контент — Истории` | Stories |
| `Контент — Предложенные записи` | Предложенные записи сообщества |
| `Автоматизации — Конкурс отзывов` | Конкурсы, циклы, промокоды |
| `Настройки — Интеграции` | Токены, системные страницы |
| `Настройки — Проекты` | Управление проектами |
| `Навигация — Сайдбар` | Боковая панель, меню |
| `Общее — Уведомления` | Toast, предупреждения |
| `Общее — Сервер` | БД, фоновые задачи, стабильность |
| `Общее — Проект` | Чистка кода, структура |

Формат: `"Категория — Подкатегория"` (длинное тире `—`). Можно создавать новые значения.

## Определение impactType

| Затронутые файлы | impactType |
|---|---|
| Только `.tsx` (компоненты, стили) | `'visual'` |
| Только `.py` (бэкенд, сервисы, CRUD) | `'logic'` |
| И фронтенд, и бэкенд | `'both'` |
| Новый UI + новый API | `'both'` |
| Баг зависания UI, причина в логике | `'visual'` (пользователь видел визуально) |

## Маппинг из user_rleaseX.md

| Секция в user_rleaseX.md | type | Обязательные поля |
|---|---|---|
| 🆕 Новые возможности | `'feature'` | userDescription, userSolution, userInstructions, userBenefits, section, impactType |
| ✅ Решённые задачи (баги) | `'bugfix'` | userDescription, userSolution, section, impactType |
| ✅ Решённые задачи (улучшения) | `'improvement'` | userDescription, userSolution, section, impactType |

## Чеклист после создания

- [ ] Нет ошибок TypeScript (`get_errors`)
- [ ] Все `id` уникальны глобально (не повторяются между релизами)
- [ ] `status: 'published'` если релиз завершён
- [ ] Новый файл — **первый** элемент массива `updatesData`
- [ ] `technicalDetails` заполнен из технического releaseX.md
