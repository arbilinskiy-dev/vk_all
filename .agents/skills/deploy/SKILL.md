---
name: deploy
description: Развёртывание проекта VK Content Planner на Yandex Cloud — фронтенд (S3) и бэкенд (Serverless Container или VM). AI выполняет всё автономно. Триггеры — «деплой», «задеплой», «обнови прод», «залей на сервер», «раскатай», «деплой фронта», «обнови фронт», «залей фронтенд», «деплой бэка», «обнови бэк», «залей бэкенд», «деплой на предпрод», «обнови предпрод», «полный деплой», «обнови всё», «запусти локально», «развернуть локально», «подними локально», «деплой на VM», «обнови VM».
---

# Deploy — Развёртывание VK Content Planner

## Определение цели деплоя

| Фраза пользователя | Что деплоить |
|---|---|
| «деплой бэка», «обнови бэк», «деплой на предпрод» | Бэкенд на **VM** (api.dosmmit.ru) — основной способ |
| «деплой на контейнер», «деплой на Serverless» | Бэкенд на **Serverless Container** (резерв) |
| «деплой фронта», «обнови фронт», «залей фронтенд» | Только фронтенд |
| «полный деплой», «обнови всё» | Бэкенд (VM) → потом фронтенд |
| «деплой» (без уточнения) | **Спросить**: бэкенд, фронтенд или оба? |
| «запусти локально», «подними локально» | Локальная разработка |

## Текущее состояние инфраструктуры (19.02.2026)

| Компонент | Способ | Статус |
|-----------|--------|--------|
| Предпрод-бэкенд | VM api.dosmmit.ru (HTTPS) | ✅ Рабочий (основной) |
| Предпрод-бэкенд | Serverless Container | Резерв |
| Предпрод-фронтенд | S3 бакет | ✅ Рабочий |
| `shared/config.ts` | Смотрит на VM | ✅ |
| SSL сертификат | Let's Encrypt, автопродление | ✅ До 20.05.2026 |

---

## Процедура: Деплой бэкенда (VM) — ОСНОВНОЙ СПОСОБ

AI делает **все шаги полностью автономно**.

### Реквизиты VM

```
VM_IP:       93.77.184.105
VM_USER:     yc-user
SSH_KEY:     %USERPROFILE%\.ssh\id_ed25519
DOMAIN:      api.dosmmit.ru
REGISTRY:    cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend
```

### Шаг 1: Определить TAG

Прочитать [references/credentials.md](references/credentials.md) для реквизитов.

1. Прочитать `backend_python/deploy_preprod.bat`
2. Найти `set TAG=vXX`
3. Увеличить на 1 (например `v70` → `v71`)
4. Обновить значение TAG в файле
5. Также обновить TAG в `backend_python/vm_deploy/deploy_vm.bat`

### Шаг 2: Проверить Docker

```cmd
docker info
```
Если ошибка → сообщить: «Запусти Docker Desktop и подожди 30 секунд».

### Шаг 3: Собрать образ

```cmd
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
docker build --no-cache -t vk-planner-backend .
```

### Шаг 4: Авторизоваться в реестре и запушить

```cmd
yc container registry configure-docker
docker tag vk-planner-backend cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:vXX
docker tag vk-planner-backend cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:latest
docker push cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:vXX
docker push cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:latest
```

### Шаг 5: Авторизовать Docker на VM и обновить

```powershell
$token = (yc iam create-token).Trim()
ssh -i "$HOME\.ssh\id_ed25519" yc-user@93.77.184.105 "echo '$token' | sudo docker login --username iam --password-stdin cr.yandex"
ssh -i "$HOME\.ssh\id_ed25519" yc-user@93.77.184.105 "cd /home/yc-user/vkplanner && sudo docker compose pull && sudo docker compose up -d"
```

### Шаг 6: Проверка

**Через MCP (предпочтительно):**
```
mcp_fetch → GET https://api.dosmmit.ru/api/version
```

**Fallback (терминал):**
```powershell
Invoke-RestMethod -Uri "https://api.dosmmit.ru/api/version"
```

### Шаг 7: Сообщить результат

```
✅ Бэкенд vXX обновлён на VM.

Проверка: https://api.dosmmit.ru/api/version
```

---

## Процедура: Деплой бэкенда (Serverless Container) — РЕЗЕРВ

> **Статус:** Резервный способ. Использовать только если VM недоступна.
> Контейнер `vk-planner-backend-preprod` остаётся в Yandex Cloud.

AI делает шаги 1-5 **полностью автономно**. Шаг 6 (ревизия) — пользователь делает сам.

> Процедура идентична старой: build → push → пользователь создаёт ревизию.
> После ревизии — переключить `shared/config.ts` обратно на контейнер:
> ```typescript
> const PRE_PRODUCTION_API_URL = 'https://bbaumq46ep27n4mvnbmk.containers.yandexcloud.net/api';
> ```

---

## Процедура: Деплой фронтенда

AI делает **все шаги полностью автономно**.

### Шаг 1: Обновить дату в разделе «Обновления»

**Перед сборкой** проверить файлы релизов в `features/updates/data/`:

1. Найти файл `releaseXData.ts`, у которого `date: 'хх.хх.хххх'` и `status: 'in-progress'`
2. Заменить `'хх.хх.хххх'` на **текущую реальную дату** в формате `ДД.ММ.ГГГГ` (например, `'04.03.2026'`)
3. Заменить `status: 'in-progress'` на `status: 'published'`

> **Пример:** Если сегодня 04.03.2026, в файле `release9Data.ts`:
> ```typescript
> // БЫЛО:
> date: 'хх.хх.хххх',
> status: 'in-progress',
> // СТАЛО:
> date: '04.03.2026',
> status: 'published',
> ```

> **Если таких файлов нет** (все релизы уже опубликованы) — пропустить этот шаг.

### Шаг 2: Сборка

```cmd
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026"
npm install
npm run build
```

### Шаг 3: Определить файлы

Прочитать содержимое `dist/assets/` — найти точные имена JS и CSS файлов.

### Шаг 4: Определить окружение

| Фраза | Бакет |
|---|---|
| «деплой фронта», «обнови фронт» (без уточнения) → **спросить**: предпрод или прод? | — |
| «деплой фронта на предпрод», «обнови предпрод» | `vk-content-planner-frontend-preprod` |
| «деплой фронта на прод» | `vk-content-planner-frontend` |

### Шаг 5: Очистить бакет

```cmd
yc storage s3 rm "s3://BUCKET_NAME" --recursive
```

### Шаг 6: Загрузить файлы

```cmd
yc storage s3 cp "dist/index.html" "s3://BUCKET/index.html" --acl public-read --content-type "text/html; charset=utf-8"
yc storage s3 cp "dist/assets/ИМЯ.js" "s3://BUCKET/assets/ИМЯ.js" --acl public-read --content-type "application/javascript"
yc storage s3 cp "dist/assets/ИМЯ.css" "s3://BUCKET/assets/ИМЯ.css" --acl public-read --content-type "text/css"
yc storage s3 cp "dist/favicon.ico" "s3://BUCKET/favicon.ico" --acl public-read --content-type "image/x-icon"
yc storage s3 cp "dist/favicon.svg" "s3://BUCKET/favicon.svg" --acl public-read --content-type "image/svg+xml"
```

### Шаг 7: Сообщить результат

```
✅ Фронтенд задеплоен на ОКРУЖЕНИЕ.

URL: https://BUCKET.website.yandexcloud.net
```

---

## Процедура: Полный деплой

1. Выполнить **деплой бэкенда на VM** (шаги 1-5)
2. Проверить `https://api.dosmmit.ru/api/version`
3. Выполнить **деплой фронтенда** (шаги 1-7)

---

## Процедура: Локальная разработка

Триггеры: «запусти локально», «развернуть локально», «подними локально»

Выдать готовые команды:

```cmd
:: Терминал 1 — Бэкенд
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

:: Терминал 2 — VK Callback Worker (опционально)
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
python -m services.vk_callback.worker

:: Терминал 3 — Фронтенд
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026"
npm run dev -- --host 0.0.0.0 --port 5173

:: Терминал 4 — SSH Tunnel для VK Callback (если нужен Callback от VK)
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
start_tunnel.bat
```

### SSH Tunnel для VK Callback

> **Когда нужен:** Если локально тестируется функционал, где VK шлёт события (Callback API) — подтверждение сервера, новые сообщения, комментарии и т.д.

**Схема:** `VK → https://api.dosmmit.ru/api/vk/callback-local → nginx (VM) → VM:8001 (SSH tunnel) → localhost:8000`

**Скрипт автоматически:**
1. Проверяет, что бэкенд работает на `localhost:8000`
2. Подключается к VM и **убивает старый процесс на порту 8001** (если висит от предыдущего туннеля)
3. Устанавливает новый SSH reverse tunnel

**Ручной запуск (если bat недоступен):**
```powershell
# 1. Убить старый туннель на VM
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" yc-user@93.77.184.105 "sudo fuser -k 8001/tcp 2>/dev/null"

# 2. Запустить новый туннель
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -N -R 8001:localhost:8000 yc-user@93.77.184.105
```

**Реквизиты:**
- VM: `93.77.184.105` (api.dosmmit.ru), пользователь: `yc-user`
- SSH ключ: `%USERPROFILE%\.ssh\id_ed25519`
- Порт на VM: `8001`, локальный порт: `8000`
- Callback URL: `https://api.dosmmit.ru/api/vk/callback-local`

**Частая проблема:** `Error: remote port forwarding failed for listen port 8001` — значит порт занят старым туннелем. Скрипт `start_tunnel.bat` решает это автоматически. Вручную: `ssh yc-user@93.77.184.105 "sudo fuser -k 8001/tcp"`.

Напомнить:
- `localStorage.setItem('api_environment', 'local')` в консоли браузера
- Логин: **admin** / Пароль: **admin**
- Для VK Callback — использовать кнопку «SSH Tunnel» в настройках Callback на фронтенде

---

## Справочники

| Файл | Когда читать |
|---|---|
| [references/credentials.md](references/credentials.md) | Реквизиты Yandex Cloud, токены, URL-ы, VM, переменные окружения |
| [references/architecture.md](references/architecture.md) | Архитектура деплоя, окружения, конфигурационные файлы |
| [references/diagnostics.md](references/diagnostics.md) | Диагностика проблем: Docker, YC CLI, CORS, DB |

---

## Делегирование саб-агентам

Для экономии контекстного окна следующие шаги рекомендуется выполнять через `runSubagent`:

| Шаг | Что делегировать | Промпт для саб-агента |
|---|---|---|
| ⚡ Шаг 1 — Определить TAG | Чтение 2 bat-файлов + инкремент | «Прочитай backend_python/deploy_preprod.bat и vm_deploy/deploy_vm.bat. Найди set TAG=vXX. Увеличь на 1. Обнови в обоих файлах. Верни новый TAG» |
| ⚡ Шаг 1 — Реквизиты | Чтение credentials.md | «Прочитай references/credentials.md. Верни JSON: VM_IP, VM_USER, SSH_KEY_PATH, DOMAIN, REGISTRY» |
| Фронтенд Шаг 3 — Файлы dist/ | Список файлов после сборки | «Прочитай содержимое dist/assets/. Верни: JS_FILE=имя.js, CSS_FILE=имя.css» |
| При ошибке — Диагностика | Поиск решения в diagnostics.md | «Прочитай references/diagnostics.md. Ошибка: {текст}. Верни: 1) причина 2) команды для исправления 3) как проверить» |

**⚡ ПАРАЛЛЕЛЬНО:** «Определить TAG» + «Реквизиты» — запускать одновременно (чтение из разных файлов, результаты не зависят друг от друга).
