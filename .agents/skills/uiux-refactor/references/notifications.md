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
