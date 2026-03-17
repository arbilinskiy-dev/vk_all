# Процедура: Контракт моков (autospec)

**Триггер:** «контракт моков», «autospec», «проверь сигнатуры», «mock contract», «тесты не ловят баги», «MagicMock пропускает»
**Время:** 1-3 минуты на модуль
**Приоритет:** 🔴 P0
**⚡ Параллельность:** БЕЗОПАСНО с любыми тестами. Пишет в `backend_python/tests/<модуль>/`. Читает только сигнатуры функций.

## Проблема

`MagicMock()` без `spec` / `autospec` **молча проглатывает любые вызовы**:
- Несуществующие атрибуты → MagicMock вернёт новый MagicMock (не AttributeError)
- Неправильные kwargs → MagicMock примет всё (не TypeError)
- Результат: тесты зелёные, но код падает в runtime

### Реальный пример из проекта

```python
# БАГ 1: crud.get_all_active_projects — метод не существует
# MagicMock().get_all_active_projects → MagicMock (OK)
# Реальный crud → AttributeError ❌

# БАГ 2: update_task(..., projects=[...]) — параметр projects не существует
# MagicMock().update_task(projects=[...]) → None (OK)
# Реальный update_task → TypeError ❌

# РЕШЕНИЕ: autospec=True
with patch('module.crud', autospec=True) as mock_crud:
    mock_crud.get_all_active_projects()  # → AttributeError ✅ баг пойман!

with patch('module.task_monitor', autospec=True) as mock_tm:
    mock_tm.update_task(task_id, "running", projects=[])  # → TypeError ✅ баг пойман!
```

## Когда применять

**ОБЯЗАТЕЛЬНО** при написании тестов для:
- Сервисов (`services/`) — много зависимостей через `@patch`
- Фоновых задач — task_monitor, crud, внешние API
- Любой код с 3+ мокированными зависимостями

**Когда НЕ нужно:**
- Простые unit-тесты без моков
- Тесты через `TestClient` (реальные зависимости)

## TODO-шаблон

1. [ ] Определить модуль и его зависимости (что мокается)
2. [ ] Для КАЖДОЙ мокированной зависимости проверить: используется ли `autospec=True` или `spec=RealClass`
3. [ ] Если нет — добавить класс `Test<Module>ContractSafety` с autospec-тестами
4. [ ] Каждый тест — один контракт: вызов с правильной сигнатурой / НЕ вызов несуществующего метода
5. [ ] Запустить `pytest tests/<модуль>/test_<файл>.py -v`
6. [ ] Вердикт: сколько контрактов проверено, сколько нарушений найдено

## Паттерн теста

```python
class TestModuleContractSafety:
    """Контрактные тесты: autospec гарантирует совпадение сигнатур."""

    def test_dependency_method_exists(self):
        """Проверяет что вызываемый метод реально существует."""
        with patch('path.to.dependency', autospec=True) as mock_dep:
            # Настраиваем mock — если метод не существует, autospec кинет AttributeError
            mock_dep.some_method.return_value = expected_result
            
            # Вызов тестируемого кода
            result = tested_function()
            
            # Если дошли сюда — метод существует
            mock_dep.some_method.assert_called_once()

    def test_dependency_signature_matches(self):
        """Проверяет что kwargs тестируемого кода совпадают с реальной сигнатурой."""
        with patch('path.to.dependency', autospec=True) as mock_dep:
            mock_dep.some_method.return_value = None
            
            # Вызов тестируемого кода — если передаст неизвестный kwarg, autospec кинет TypeError
            tested_function()
            
            # Проверяем вызов с ПРАВИЛЬНЫМИ аргументами
            args, kwargs = mock_dep.some_method.call_args
            assert 'expected_param' in kwargs
```

## Правила

1. **Один тест — один контракт.** НЕ проверять бизнес-логику, только сигнатуры.
2. **autospec СТРОГО на внешних зависимостях** (crud, task_monitor, внешние API). Не на тестируемом модуле.
3. **Класс `Test<Module>ContractSafety`** — отдельный класс в файле тестов, НЕ смешивать с функциональными тестами.
4. **Негативные тесты**: если код вызывает `dep.method_that_might_not_exist()`, autospec СРАЗУ покажет ошибку — не нужен отдельный негативный тест.
5. **При добавлении зависимости** к сервису — добавить контрактный тест на неё.

## Интеграция с процедурой 02 (интеграционные тесты)

При покрытии модуля тестами (процедура 02), ВСЕГДА включать блок контрактных autospec-тестов:
1. Сначала — функциональные тесты (бизнес-логика, CRUD, валидация)
2. Затем — `Test<Module>ContractSafety` (autospec на каждую мокированную зависимость)
