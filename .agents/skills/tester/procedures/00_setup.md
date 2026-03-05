# Процедура: Подготовка инфраструктуры (первый запуск)

**Триггер:** Первый запрос на тестирование, или `tests/` папки не существует.

## TODO-шаблон

1. [ ] Установить pytest, pytest-asyncio, httpx (`pip install`)
2. [ ] Создать `conftest.py` → см. `references/conftest_template.md`
3. [ ] Задеплоить скрипты из `scripts/` (smoke_test.py, check_imports.py)
4. [ ] Проверить что Vitest установлен (фронтенд)

## Бэкенд

```bash
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
pip install pytest pytest-asyncio httpx
```

Добавить в `requirements.txt`:
```
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

## Фронтенд

Vitest v4.0.18 + @testing-library/react 16.3.2 — уже установлены.

## Шаблоны

→ `references/conftest_template.md` (conftest.py с фикстурами)
