# Текст со счётчиками

**КРИТИЧЕСКОЕ ПРАВИЛО:** При отображении текстовых меток с числовыми счётчиками (количества, итоги, статистика) ВСЕГДА используй формат с тире: `"Текст - Число"`. НИКОГДА не используй формат со скобками `"Текст (Число)"`.

## Правильно

```tsx
// ✅ ПРАВИЛЬНО
<span>Все - 225</span>
<button>Проекты - {count}</button>
<div>Ошибки при обработке - {errors.length} проектов</div>
```

## Неправильно

```tsx
// ❌ НЕПРАВИЛЬНО
<span>Все (225)</span>
<button>Проекты ({count})</button>
<div>Ошибки при обработке ({errors.length} проектов)</div>
```

## Бейдж «Загружено X из Y» для списков с серверной пагинацией

Если таблица/список загружает данные с пагинацией (не все записи сразу) — рядом с заголовком секции выводить бейдж `Загружено: {loaded} из {total}`.

### Эталонная реализация

**Бэкенд** — возвращает `total_count` рядом со списком:
```python
total_count = db.query(func.count(Model.id)).scalar() or 0
items = db.query(Model).order_by(...).limit(limit).all()
return {"items": items_list, "total_count": total_count}
```

**Фронтенд хук** — хранит `totalCount` в стейте:
```typescript
const [totalCount, setTotalCount] = useState(0);

const data = await api.getLogs(page, pageSize);
setItems(data.items);
setTotalCount(data.total_count);
```

**UI** — единый бейдж:
```tsx
// ✅ ПРАВИЛЬНО — один бейдж «Загружено: X из Y»
<h2 className="text-lg font-semibold text-gray-800">VK Логи</h2>
<span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
    Загружено: {currentLogsCount} из {totalCount}
</span>
```

```tsx
// ❌ НЕПРАВИЛЬНО — два отдельных бейджа
<span>Всего в базе: {totalCount}</span>
<span>Показано: {filteredLogs.length}</span>

// ❌ НЕПРАВИЛЬНО — показывать длину массива вместо реального total_count из БД
<span>{filteredLogs.length} записей</span>
```

### Живые примеры в проекте

| Компонент | Файл |
|---|---|
| VK Логи (эталон) | `features/users/components/token-logs-dashboard/components/DashboardHeader.tsx` |
| Callback API логи | `features/settings/components/CallbackApiSettings.tsx` |

## Где проверять

- Кнопки фильтров с количеством
- Вкладки/табы со статистикой
- Заголовки секций с итогами
- Индикаторы прогресса
- Сводки ошибок/предупреждений
- Таблицы/списки с серверной пагинацией

## Паттерны поиска нарушений

При аудите искать в коде:
- `{count})` — скобка после переменной-счётчика
- `(${` — открывающая скобка перед template literal
- `.length)` — скобка после `.length`
- Любые конструкции вида `Текст (число)` в JSX
- `{items.length} записей` без `total_count` — подозрение на отсутствие серверного подсчёта
