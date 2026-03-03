# Credentials — Реквизиты проекта

## Yandex Cloud

```
FOLDER_ID:           b1g1qicqnhgh8tthu3up
REGISTRY_ID:         crpq5n1men523nvih5j4
SERVICE_ACCOUNT_ID:  ajevmi0k5m5lb1t7h2fj
```

## Контейнеры

```
CONTAINER_NAME_PROD:    (определить при первом деплое на прод)
CONTAINER_NAME_PREPROD: vk-planner-backend-preprod (устарел, теперь VM)
IMAGE_NAME:             vk-planner-backend
```

## VM (предпрод)

```
VM_NAME:             vkplaner-backend
VM_ID:               fhmf2vlcu2013ed30ui2
VM_IP:               93.77.184.105
VM_USER:             yc-user
SSH_KEY:             %USERPROFILE%\.ssh\id_ed25519
DOMAIN:              api.dosmmit.ru
OS:                  Ubuntu 24.04 LTS
vCPU / RAM / Disk:   2 / 4 ГБ / 20 ГБ SSD
```

## S3 бакеты (фронтенд)

```
BUCKET_PROD:         vk-content-planner-frontend
BUCKET_PREPROD:      vk-content-planner-frontend-preprod
```

## URLs

```
BACKEND_PROD_URL:    https://bba15i6uulg2j0uk90sm.containers.yandexcloud.net
BACKEND_PREPROD_URL: https://api.dosmmit.ru
FRONTEND_PROD_URL:   https://vk-content-planner-frontend.website.yandexcloud.net
FRONTEND_PREPROD_URL:https://vk-content-planner-frontend-preprod.website.yandexcloud.net
```

## База данных (PostgreSQL Yandex Cloud)

```
DATABASE_URL: postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1
```

## Авторизация

```
ADMIN_USERNAME: admin
ADMIN_PASSWORD: admin
```

## Переменные окружения контейнера

Эти переменные **ОБЯЗАТЕЛЬНЫ** при каждом создании ревизии контейнера.
Без них контейнер не подключится к БД и VK API.

```
VK_USER_TOKEN:       vk1.a.MepRLhKDuFBN9Nzggi2iPturCVl1QdXuwAVlHGKeL0WVjLWart-cXKQwPavxJU8QMYOO34qSoMBQi0IglOP0hXIGe7BTxMvFb-PaxQgkXDtyI3barOwHH5DHAkqS5mZq7WDilWo8gAN1HZTCGvUFQo-krGv0m3NlYpd10I3lz94hdlpUSnEAlNciaSmX6AUTSwMAqBn-uKslwMScvGsZ0Q
GEMINI_API_KEY:      AIzaSyBzC7zVoOaGXEt1Rql62sx4l2l2huanxGk
ENCRYPTION_KEY:      uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=
ENCRYPTION_KEY_NEW:  (пустая строка)
REDIS_HOST:          rc1b-fu5ptri1qmla03fa.mdb.yandexcloud.net
REDIS_PORT:          6379
GEMINI_PROXY_URL:    http://eHWaRc:cX0J3J@186.179.62.43:9483
ADMIN_USERNAME:      admin
ADMIN_PASSWORD:      admin
DATABASE_URL:        postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1
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
