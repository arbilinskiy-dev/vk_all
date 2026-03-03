# Credentials — Реквизиты проекта

> **ВНИМАНИЕ:** Реальные секреты хранятся ТОЛЬКО в .env файлах локально.
> Этот файл содержит только структуру без реальных значений.

## Yandex Cloud

```
FOLDER_ID:           <из .env>
REGISTRY_ID:         <из .env>
SERVICE_ACCOUNT_ID:  <из .env>
```

## Контейнеры

```
CONTAINER_NAME_PROD:    <определить при первом деплое на прод>
CONTAINER_NAME_PREPROD: vk-planner-backend-preprod
IMAGE_NAME:             vk-planner-backend
```

## VM (предпрод)

```
VM_NAME:             vkplaner-backend
VM_IP:               <из .env>
VM_USER:             yc-user
SSH_KEY:             %USERPROFILE%\.ssh\id_ed25519
DOMAIN:              api.dosmmit.ru
```

## S3 бакеты (фронтенд)

```
BUCKET_PROD:         vk-content-planner-frontend
BUCKET_PREPROD:      vk-content-planner-frontend-preprod
```

## URLs

```
BACKEND_PROD_URL:    <из .env>
BACKEND_PREPROD_URL: https://api.dosmmit.ru
FRONTEND_PROD_URL:   <из S3>
FRONTEND_PREPROD_URL:<из S3>
```

## База данных (PostgreSQL Yandex Cloud)

```
DATABASE_URL: <из .env>
```

## Авторизация

```
ADMIN_USERNAME: <из .env>
ADMIN_PASSWORD: <из .env>
```

## Переменные окружения контейнера

Эти переменные **ОБЯЗАТЕЛЬНЫ** при каждом создании ревизии контейнера.

```
VK_USER_TOKEN:       <из .env>
GEMINI_API_KEY:      <из .env>
ENCRYPTION_KEY:      <из .env>
ENCRYPTION_KEY_NEW:  <из .env>
REDIS_HOST:          <из .env>
REDIS_PORT:          6379
GEMINI_PROXY_URL:    <из .env>
ADMIN_USERNAME:      <из .env>
ADMIN_PASSWORD:      <из .env>
DATABASE_URL:        <из .env>
```

## Пути на локальной машине

```
PROJECT_ROOT:  c:\Users\nikita79882\Desktop\vk planer code\12.02.2026
BACKEND_PATH:  c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python
```

## Файл с текущем TAG

```
backend_python/deploy_preprod.bat → переменная `set TAG=vXX`
```
