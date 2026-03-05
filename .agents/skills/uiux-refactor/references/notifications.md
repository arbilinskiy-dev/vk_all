# Уведомления и подтверждения

**Правило:** ЗАПРЕЩЕНО использовать нативные методы браузера: `alert()`, `confirm()`, `prompt()`. Они блокируют поток, выглядят устаревшими и могут быть незаметны (окно не в фокусе).

## Toast-уведомления

- **Позиция:** Правый нижний угол
- **Поведение:** Автоматически исчезают через несколько секунд или при клике
- **Реализация:** Через `showAppToast(message, type)` или `toastBridge.success()` / `toastBridge.error()`
- **Назначение:** Неблокирующие уведомления: "Сохранено", "Скопировано", ошибки фоновых процессов

## Модалки подтверждения

- **Компонент:** `ConfirmationModal` из `shared/components/modals/ConfirmationModal.tsx`
- **Когда:** Действия, требующие явного согласия (удаление, деструктивные правки)
- **Z-index:** Выше всех элементов
- **Backdrop:** `bg-black/50` (затемнённый фон)
- **Кнопки:**
  - Подтверждение: Primary (зелёный) или Danger (красный)
  - Отмена: Secondary (серый)
- **Закрытие:** Кнопка "Отмена" или клик за пределами (если безопасно)

## Реализация через состояние

```tsx
const [showConfirm, setShowConfirm] = useState(false);

// Вместо:
// if (confirm('Удалить?')) handleDelete();

// Делай так:
<button onClick={() => setShowConfirm(true)}>Удалить</button>

{showConfirm && (
    <ConfirmationModal
        title="Подтверждение удаления"
        message="Вы уверены, что хотите удалить?"
        onConfirm={() => { handleDelete(); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
    />
)}
```

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| `window.confirm('Удалить?')` | `ConfirmationModal` через `useState` |
| `alert('Сохранено')` | `toastBridge.success('Сохранено')` |
| `prompt('Введите имя')` | Инпут в модалке |
| `confirm()` без `window.` | Тоже запрещено — использовать `ConfirmationModal` |
| Инлайн `<div className="bg-green-50 ...">Успех</div>` | `toast.success(msg)` — через `useToast()` |
| `useState` + `setTimeout` для скрытия уведомления | `useToast().success()` — таймер встроен |

## ЗАПРЕТ: Инлайн-алерты для транзиентных уведомлений

**ЗАПРЕЩЕНО** использовать инлайн-блоки (`bg-green-50 border-green-200`, `bg-red-50 border-red-200` и т.п.) для временных уведомлений об успехе/ошибке операций. Вместо этого **ОБЯЗАТЕЛЬНО** использовать систему toast-уведомлений.

### Почему запрещено
- Инлайн-алерты сдвигают контент (layout shift), ломают визуальную стабильность
- Требуют лишнего `useState` + `setTimeout` для управления видимостью
- Toast-уведомления уже реализованы и стандартизированы — `useToast()` из `shared/components/ToastProvider.tsx`
- Всплывашки в правом нижнем углу не мешают работе с интерфейсом

### Как правильно

```tsx
// ❌ НЕПРАВИЛЬНО — инлайн-алерт
const [showSuccess, setShowSuccess] = useState(false);

const handleAction = async () => {
    await doSomething();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
};

// В JSX:
{showSuccess && (
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
        ✓ Операция выполнена!
    </div>
)}
```

```tsx
// ✅ ПРАВИЛЬНО — toast-уведомление
import { useToast } from '../../../shared/components/ToastProvider';

const toast = useToast();

const handleAction = async () => {
    const result = await doSomething();
    toast.success('Операция выполнена!', 'Заголовок');
};
// Никакого JSX для уведомления — toast появится в правом нижнем углу автоматически
```

### API toast-уведомлений

| Метод | Назначение |
|---|---|
| `toast.success(message, title?)` | Зелёный — успех |
| `toast.error(message, title?)` | Красный — ошибка |
| `toast.warning(message, title?)` | Жёлтый — предупреждение |
| `toast.info(message, title?)` | Нейтральный — информация |
| `showAppToast(message, type)` | Из не-React кода (через `shared/toastBridge.ts`) |

### Где допустимы инлайн-блоки
- **Статичные** информационные панели (справка, подсказки, описания) — НЕ связанные с результатом операции
- Блоки в обучающих материалах (`features/training/`)
- Предупреждения, которые должны быть **постоянно видны** (например, «Требуется настройка»)
