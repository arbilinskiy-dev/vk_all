# Инструкция: Google Workspace MCP

MCP-сервер `google-workspace` подключён и авторизован. Аккаунт: `arbilinskiy@gmail.com`.

## Обязательное правило

**Во ВСЕХ вызовах** Google Workspace MCP **всегда** передавай параметр:
```
user_google_email: "arbilinskiy@gmail.com"
```
Не спрашивай email у пользователя — он уже известен.

## Доступные инструменты (tier: core)

### 📧 Gmail (почта)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `search_gmail_messages` | Поиск писем (Gmail search operators) | `query`, `page_size` (до 100), `page_token` |
| `get_gmail_message_content` | Содержимое одного письма | `message_id` |
| `get_gmail_messages_content_batch` | Содержимое нескольких писем (до 25) | `message_ids` (массив), `format` ("full"/"metadata") |
| `send_gmail_message` | Отправка письма (новое или ответ) | `to`, `subject`, `body`, `body_format` ("plain"/"html"), `cc`, `bcc`, `attachments`, `thread_id` (для ответа), `in_reply_to`, `references` |

**Паттерн работы с Gmail:**
1. `search_gmail_messages` → получить `message_id` из результатов
2. `get_gmail_messages_content_batch` → получить содержимое писем
3. При ответе: использовать `thread_id`, `in_reply_to` и `references` из оригинального письма

**Gmail search операторы:** `in:inbox`, `from:`, `to:`, `subject:`, `is:unread`, `has:attachment`, `after:2026/03/01`, `before:`, `label:`, `newer_than:1d`

### 📁 Google Drive (файлы)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `search_drive_files` | Поиск файлов на Диске | `query` (Drive search operators), `page_size`, `file_type` ("folder"/"doc"/"sheet"/"pdf" и др.) |
| `create_drive_file` | Создать файл | `file_name`, `content`, `folder_id`, `mime_type` |
| `create_drive_folder` | Создать папку | `folder_name`, `parent_folder_id` |
| `get_drive_file_content` | Прочитать содержимое файла | `file_id` |
| `get_drive_file_download_url` | Скачать файл / получить URL | `file_id`, `export_format` ("pdf"/"docx"/"xlsx"/"csv") |
| `get_drive_shareable_link` | Получить ссылку для расшаривания | `file_id` |

**Drive search операторы:** `name contains 'отчёт'`, `mimeType='application/pdf'`, `modifiedTime > '2026-01-01'`, `'folder_id' in parents`

### 📝 Google Docs (документы)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `create_doc` | Создать документ | `title`, `content` (опционально) |
| `get_doc_content` | Прочитать документ | `document_id` |
| `modify_doc_text` | Вставить/заменить текст + форматирование | `document_id`, `start_index`, `end_index`, `text`, `bold`, `italic`, `font_size`, `font_family`, `text_color`, `link_url` |
| `import_to_google_doc` | Импорт файла (MD, DOCX, HTML) в Docs | `file_name`, `content`/`file_path`/`file_url`, `source_format` |

### 📊 Google Sheets (таблицы)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `create_spreadsheet` | Создать таблицу | `title`, `sheet_names` (массив имён листов) |
| `read_sheet_values` | Прочитать данные из диапазона | `spreadsheet_id`, `range_name` ("Sheet1!A1:D10") |
| `modify_sheet_values` | Записать/обновить/очистить данные | `spreadsheet_id`, `range_name`, `values` (2D массив), `clear_values` (true для очистки) |

**Формат range_name:** `"Sheet1!A1:D10"`, `"A1:Z1000"` (без имени листа = первый лист)

### 📅 Google Calendar (календарь)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `list_calendars` | Список всех календарей | — |
| `get_events` | Получить события | `calendar_id` ("primary"), `time_min`/`time_max` (RFC3339), `query`, `max_results`, `detailed` |
| `manage_event` | Создать/обновить/удалить событие | `action` ("create"/"update"/"delete"), `summary`, `start_time`, `end_time` (RFC3339), `event_id` (для update/delete), `description`, `location`, `attendees`, `timezone`, `add_google_meet` |

**Формат времени RFC3339:** `"2026-03-04T10:00:00+03:00"` или `"2026-03-04T07:00:00Z"`

### ✅ Google Tasks (задачи)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `list_tasks` | Список задач в списке | `task_list_id`, `max_results`, `show_completed` |
| `get_task` | Детали задачи | `task_list_id`, `task_id` |
| `manage_task` | Создать/обновить/удалить/переместить | `action` ("create"/"update"/"delete"/"move"), `task_list_id`, `title`, `notes`, `due` (RFC3339), `status` ("needsAction"/"completed") |

### 👥 Google Contacts (контакты)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `list_contacts` | Список контактов | `page_size`, `sort_order` |
| `search_contacts` | Поиск контактов | `query` |
| `get_contact` | Детали контакта | `contact_id` |
| `manage_contact` | Создать/обновить/удалить контакт | `action` ("create"/"update"/"delete"), `given_name`, `family_name`, `email`, `phone`, `organization` |

### 💬 Google Chat

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `get_messages` | Получить сообщения из пространства | `space_id`, `page_size` |
| `search_messages` | Поиск сообщений | `query`, `space_id` (опционально) |
| `send_message` | Отправить сообщение | `space_id`, `message_text`, `thread_name`/`thread_key` |
| `create_reaction` | Добавить реакцию | `message_id`, `emoji_unicode` |

### 📺 Google Slides (презентации)

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `create_presentation` | Создать презентацию | `title` |
| `get_presentation` | Получить детали презентации | `presentation_id` |

### 📋 Google Forms

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `create_form` | Создать форму | `title`, `description` |
| `get_form` | Получить детали формы | `form_id` |

### ⚙️ Apps Script

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `list_script_projects` | Список проектов | `page_size` |
| `create_script_project` | Создать проект | `title`, `parent_id` |
| `get_script_project` | Все файлы проекта | `script_id` |
| `get_script_content` | Содержимое файла | `script_id`, `file_name` |
| `update_script_content` | Обновить файлы | `script_id`, `files` (массив объектов с name, type, source) |
| `run_script_function` | Запустить функцию | `script_id`, `function_name`, `parameters` |
| `generate_trigger_code` | Сгенерировать код триггера | `trigger_type`, `function_name`, `schedule` |

### 🔍 Google Custom Search

| Инструмент | Что делает | Ключевые параметры |
|---|---|---|
| `search_custom` | Поиск в интернете через Google | `q`, `num` (1-10), `site_search`, `date_restrict` ("d5"=5 дней, "m3"=3 месяца), `file_type`, `sites` (массив доменов) |

## Типовые сценарии

### Проверить последние письма
```
1. search_gmail_messages(query="in:inbox", page_size=5)
2. get_gmail_messages_content_batch(message_ids=[...])
```

### Найти файл на Диске и прочитать
```
1. search_drive_files(query="name contains 'контент-план'")
2. get_drive_file_content(file_id="...")
```

### Создать событие в календаре
```
manage_event(action="create", summary="Встреча", start_time="2026-03-05T14:00:00+03:00", end_time="2026-03-05T15:00:00+03:00")
```

### Создать таблицу и заполнить данными
```
1. create_spreadsheet(title="Отчёт")  → spreadsheet_id
2. modify_sheet_values(spreadsheet_id="...", range_name="A1:C3", values=[["Имя","Дата","Статус"],["Пост 1","2026-03-04","Готов"]])
```

### Отправить email
```
send_gmail_message(to="user@example.com", subject="Тема", body="Текст письма")
```

### Ответить на письмо
```
1. get_gmail_message_content(message_id="...") → получить thread_id, Message-ID
2. send_gmail_message(to="...", subject="Re: ...", body="Ответ", thread_id="...", in_reply_to="<...>", references="<...>")
```

## Ограничения

- **OAuth-токены** сохранены локально, повторная авторизация не нужна
- **MCP-порт:** 8089 (не конфликтует с бэкендом на 8000)
- **Batch Gmail:** максимум 25 писем за раз
- **Tier:** core — основные инструменты. Для расширенных (`--tool-tier extended/complete`) нужно изменить mcp.json
