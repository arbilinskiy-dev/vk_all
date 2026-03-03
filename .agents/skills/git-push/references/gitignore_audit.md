# Чеклист .gitignore — что НЕ должно попасть в репозиторий

## Обязательно в .gitignore

### Секреты и токены
```
.env
.env.*
*.key
*_secret*
vk_api_methods_tokens.json
vk_group_token_methods.json
```

### Конфигурация с секретами
```
backend_python/config.py         # Содержит SECRET_KEY, DATABASE_URL, токены
```

> **Внимание:** `config.py` может уже быть в git (закоммичен ранее). 
> Если он содержит реальные секреты — нужно:
> 1. Вынести секреты в переменные окружения
> 2. `git rm --cached backend_python/config.py`
> 3. Добавить в .gitignore

### Логи и временные файлы
```
logs_sync.json
logs_sync.txt
*.log
```

### Зависимости и сборка
```
node_modules/
dist/
dist-ssr/
__pycache__/
*.py[cod]
.venv/
```

### IDE
```
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.sw?
```

## Проверка перед пушем

```bash
# Посмотреть что попадёт в коммит
git status --short

# Поискать чувствительные файлы в staging
git diff --cached --name-only | Select-String "config|secret|token|\.env|\.key"
```

## Если секрет уже закоммичен

```bash
# Удалить из отслеживания (файл останется локально)
git rm --cached <файл>
echo "<файл>" >> .gitignore
git commit -m "chore: убрал секрет из отслеживания"
```

> **Важно:** Если секрет уже был в истории Git — он виден в коммитах. 
> Нужно менять сам секрет (ротация ключей).
