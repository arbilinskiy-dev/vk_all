# Решённые кейсы VS Code / Copilot

## Кейс 1: Copilot Chat не показывает выбор моделей (model picker)

**Дата:** 2026-03-16  
**Симптом:** В Copilot Chat (подписка Pro) нет возможности выбрать другую модель — dropdown моделей отсутствует или показывает только одну модель.

**Диагностика:**
1. Проверили версию расширения: `github.copilot-chat@0.39.1` (единственное расширение, `github.copilot` deprecated и автоматически заменяется на `copilot-chat`).
2. VS Code `1.111.0` — поддерживает model picker (доступен с 1.104+).
3. В логах (`AppData\Roaming\Code\logs\...\window1\exthost\exthost.log`) обнаружены ошибки:
   ```
   Error: GitHubLoginFailed
     at xee._authShowWarnings → getCopilotToken → updateCachedToken
   Error: GitHubLoginFailed
     at xee._authShowWarnings → getCopilotToken → ok._fetchModels
   ```
4. Ключевая строка: `_fetchModels` падает из-за `GitHubLoginFailed` — расширение не может получить токен авторизации GitHub → не загружает список доступных моделей → model picker пуст.
5. Сеть до `api.github.com` доступна (200), прокси не настроен.

**Причина:** Сбой/устаревание токена авторизации GitHub внутри VS Code. Расширение Copilot Chat не может получить Copilot-токен → не запрашивает список моделей у API.

**Решение:**
1. VS Code → Accounts → Sign out из GitHub
2. Command Palette → `GitHub Copilot: Sign out`
3. Закрыть ВСЕ окна VS Code
4. Открыть VS Code → `GitHub Copilot: Sign in` (повторный вход)
5. `Developer: Reload Window`
6. Проверить dropdown моделей в Copilot Chat

**Дополнительно (если не помогло):**
- Проверить, что вход выполнен тем GitHub-аккаунтом, где активна подписка Copilot Pro
- Если аккаунт в организации — админ может ограничить модели через Copilot policy settings → `Editor Preview Features`
- Сбросить кэш Copilot Chat: переименовать `AppData\Roaming\Code\User\globalStorage\github.copilot-chat` → перезапустить VS Code

**Где искать логи:**
- `%APPDATA%\Code\logs\<последняя_сессия>\window1\exthost\exthost.log` — ошибки авторизации и загрузки моделей
- Искать паттерны: `GitHubLoginFailed`, `_fetchModels`, `getCopilotToken`, `entitlement`, `unauthorized`

## Кейс 2: В Bitrix24 при редактировании сообщения «съедаются» первые буквы строк

**Дата:** 2026-03-16  
**Симптом:** После `im.message.update` русскоязычный текст в чате сохраняется с потерей первых букв строк: «Исправили» -> «справили», «Что» -> «то».

**Причина:** Проблема кодировки при передаче кириллицы из PowerShell/терминала (cp1251/UTF-8 mismatch) в inline-команде `python -c`.

**Проверка:**
1. Редактирование технически срабатывает (`result: true`).
2. Но текст сообщения в чате искажается.
3. Контрольный апдейт ASCII-строкой (`TEST_UPDATE_...`) проходит без искажений.

**Рабочее решение (использовать по умолчанию):**
- Для редактирования/отправки русских сообщений через терминал передавать текст в формате Unicode-escape (`\uXXXX`) внутри `python -c`.
- Либо использовать Python-скрипт в отдельном `.py` файле с явной `UTF-8` кодировкой вместо длинной inline-команды.

**Безопасный паттерн:**
```powershell
python -c "import requests; base='https://...'; msg='\u2705 \u0418\u0441\u043f\u0440\u0430\u0432\u0438\u043b\u0438 ...'; requests.post(base+'/im.message.update', json={'MESSAGE_ID': 123, 'MESSAGE': msg}, timeout=30)"
```

**Примечание по процессу:**
- Сначала сделать тестовый `im.message.update` с коротким ASCII-маркером (если сомнения),
- затем применять финальный Unicode-safe текст и перепроверять через `b24_get_dialog_messages`.
