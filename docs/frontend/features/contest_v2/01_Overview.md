# Конкурс 2.0 — Frontend

## Обзор

Модуль `features/automations/contest-v2` реализует интерфейс для создания и управления конкурсами нового поколения. Интегрируется с системой автоматических публикаций и расписанием.

---

## Структура файлов

```
features/automations/contest-v2/
├── ContestV2Page.tsx            # Главная страница модуля
├── types.ts                     # TypeScript типы
└── components/
    ├── ContestV2List.tsx        # Список конкурсов
    └── ContestV2EditorPage.tsx  # Редактор конкурса
```

---

## Компоненты

### `ContestV2Page`
**Главный компонент-контейнер.**

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `projectId` | `string` | ID текущего проекта |
| `setNavigationBlocker` | `function` | Блокировка навигации при редактировании |
| `initialContestId` | `string?` | ID для глубокой ссылки |
| `onClearParams` | `function?` | Очистка URL-параметров |

**Состояния:**
- `list` — отображение списка конкурсов
- `create` — создание/редактирование конкурса

**Поведение:**
- При смене `projectId` автоматически возвращается к списку
- При активном редактировании блокирует навигацию
- Поддерживает deep linking через `initialContestId`

---

### `ContestV2List`
**Список конкурсов проекта.**

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `projectId` | `string` | ID проекта |
| `onCreate` | `() => void` | Callback создания |
| `onEdit` | `(id: string) => void` | Callback редактирования |

**Функционал:**
- Отображение карточек конкурсов
- Фильтрация по статусу
- Кнопка создания нового конкурса

---

### `ContestV2EditorPage`
**Редактор конкурса.**

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `projectId` | `string` | ID проекта |
| `contestId` | `string?` | ID редактируемого конкурса (null для нового) |
| `onClose` | `() => void` | Callback закрытия |

**Секции редактора:**
1. **Основная информация** — название, описание, активность
2. **Стартовый пост** — выбор типа (новый/существующий)
3. **Настройки нового поста** — дата, время, текст, изображения
4. **Ссылка на существующий пост** — URL поста VK

---

## API интеграция

Используется API-клиент `services/api/contestV2.api.ts`:

```typescript
import { contestV2Api } from '../../services/api/contestV2.api';

// Получение списка
const contests = await contestV2Api.list({ project_id: projectId });

// Создание
const newContest = await contestV2Api.create({
  project_id: projectId,
  title: 'Новый конкурс',
  is_active: true,
  start_type: 'new_post',
  // ...
});

// Обновление
await contestV2Api.update({
  contest_id: contestId,
  contest: { title: 'Новое название' }
});

// Удаление
await contestV2Api.delete({ contest_id: contestId });
```

---

## Типы

```typescript
// types.ts
interface ContestV2 {
  id: string;
  project_id: string;
  is_active: boolean;
  title: string;
  description?: string;
  start_type: 'new_post' | 'existing_post';
  existing_post_link?: string;
  start_post_date?: string;
  start_post_time?: string;
  start_post_text?: string;
  start_post_images?: ImageAttachment[];
  status: 'draft' | 'active' | 'finished';
  vk_start_post_id?: number;
  created_at: string;
  updated_at: string;
}

interface ImageAttachment {
  id: string;
  url: string;
}
```

---

## Статусы конкурса

| Статус | Описание | UI индикатор |
|--------|----------|--------------|
| `draft` | Черновик, пост не создан | 📝 Серый |
| `active` | Стартовый пост опубликован | ✅ Зелёный |
| `finished` | Конкурс завершён | 🏁 Синий |

---

## Блокировка навигации

При активном редактировании устанавливается блокировка:

```typescript
useEffect(() => {
  if (setNavigationBlocker) {
    if (viewMode === 'create') {
      setNavigationBlocker(() => () => true);
    } else {
      setNavigationBlocker(null);
    }
  }
}, [viewMode]);
```

Это предотвращает случайный уход со страницы с несохранёнными данными.

---

## См. также

- [Backend: Contest V2](../../../../backend_python/docs/features/contest_v2/01_Overview.md.txt)
- [General Contests](../general-contests/) — предыдущая версия конкурсов
- [Post Modal](../../post_modal/) — компоненты для работы с изображениями
