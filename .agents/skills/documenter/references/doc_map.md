# Doc Map — Маппинг «код → документация»

## Бэкенд: код → документация

| Папка кода | Папка документации | Примечание |
|---|---|---|
| `backend_python/routers/posts.py` | `docs/backend/features/posts/` | |
| `backend_python/routers/projects.py` | `docs/backend/features/projects/` | |
| `backend_python/routers/market.py` | `docs/backend/features/market/` | |
| `backend_python/routers/notes.py` | `docs/backend/features/notes/` | |
| `backend_python/routers/tags.py` | `docs/backend/features/tags/` | |
| `backend_python/routers/auth.py` | `docs/backend/features/auth/` | |
| `backend_python/routers/ai.py` | `docs/backend/features/ai/` | |
| `backend_python/routers/ai_presets.py` | `docs/backend/features/ai_presets/` | |
| `backend_python/routers/ai_tokens.py` | `docs/backend/features/ai_tokens/` | |
| `backend_python/routers/media.py` | `docs/backend/features/media/` | |
| `backend_python/routers/lists.py` | `docs/backend/features/lists/` | |
| `backend_python/routers/global_variables.py` | `docs/backend/features/global_variables/` | |
| `backend_python/routers/automations.py` | `docs/backend/features/automations/` | |
| `backend_python/routers/automations_ai.py` | `docs/backend/features/automations/` | В той же папке |
| `backend_python/routers/automations_general.py` | `docs/backend/features/automations/` | В той же папке |
| `backend_python/routers/stories_automation.py` | `docs/backend/features/automations/` | В той же папке |
| `backend_python/routers/bulk_edit.py` | `docs/backend/features/bulk_edit/` | |
| `backend_python/routers/contest_v2.py` | `docs/backend/features/contest_v2/` | |
| `backend_python/routers/management.py` | `docs/backend/features/system/` | |
| `backend_python/routers/system_posts.py` | `docs/backend/features/posts/` | Или system/ |
| `backend_python/routers/batch.py` | `docs/backend/` | Нет отдельной папки |
| `backend_python/routers/project_context.py` | `docs/backend/features/project_context/` | |
| `backend_python/routers/vk_callback.py` | `docs/backend/vk_callback/` | |
| `backend_python/routers/vk_test_auth.py` | `docs/backend/features/vk_test/` | |
| `backend_python/routers/sandbox.py` | `docs/sandbox/` | Отдельная секция |
| `backend_python/services/` | `docs/backend/core_services/` | Общие сервисы |
| `backend_python/crud/` | `docs/backend/crud/` | |
| `backend_python/models.py` | `docs/api/DATABASE_SCHEMA.md` | |
| `backend_python/schemas/` | `docs/backend/03_API_AND_VALIDATION.md.txt` | |

## Фронтенд: код → документация

| Папка кода | Папка документации | Примечание |
|---|---|---|
| `features/posts/` | `docs/frontend/features/post_modal/` | |
| `features/products/` | `docs/frontend/features/products/` | |
| `features/projects/` | `docs/frontend/features/projects/` | |
| `features/notes/` | `docs/frontend/features/notes/` | |
| `features/tags/` | `docs/frontend/features/tags/` | |
| `features/auth/` | `docs/frontend/features/auth/` | |
| `features/lists/` | `docs/frontend/features/lists/` | |
| `features/schedule/` | `docs/frontend/features/schedule/` | |
| `features/emoji/` | `docs/frontend/features/emoji/` | |
| `features/suggested-posts/` | `docs/frontend/features/suggested_posts/` | |
| `features/database-management/` | `docs/frontend/features/database_management/` | |
| `features/training/` | `docs/frontend/features/training/` + `docs/training/` | |
| `features/sandbox/` | `docs/sandbox/` | |
| `features/settings/` | `docs/frontend/` | Нет отдельной папки |
| `features/users/` | `docs/frontend/` | Нет отдельной папки |
| `features/automations/` | `docs/frontend/` | Нет отдельной папки |
| `features/automations/reviews-contest/` | `docs/frontend/features/reviews_contest/` | 2 файла: Overview + RichTemplateEditor |
| `features/navigation/` | `docs/frontend/` | Нет отдельной папки |
| `features/updates/` | `docs/frontend/` | Нет отдельной папки |
| `shared/` | `docs/frontend/shared/` | 4 файла |
| `hooks/` | `docs/frontend/05_HOOKS_AND_LOGIC.md` | |
| `services/` | `docs/frontend/shared/03_API_Clients.md` | |
| `contexts/` | `docs/frontend/02_STATE_MANAGEMENT.md` | |

## Общие файлы

| Файл | Документация |
|---|---|
| `App.tsx` | `docs/frontend/01_ARCHITECTURE_AND_DESIGN.md` |
| `vite.config.ts` | `docs/frontend/06_BUILD_AND_RUN.md` |
| `package.json` | `docs/frontend/06_BUILD_AND_RUN.md` |
| `backend_python/main.py` | `docs/backend/01_STRUCTURE_AND_FLOW.md.txt` |
| `backend_python/config.py` | `docs/backend/01_STRUCTURE_AND_FLOW.md.txt` |
| `backend_python/database.py` | `docs/backend/02_DATABASE.md.txt` |

## Области БЕЗ документации (потенциальные пробелы)

Фронтенд-фичи без отдельных папок в docs:
- `features/settings/`
- `features/users/`
- `features/automations/` (на фронте)
- `features/navigation/`
- `features/updates/`
- `features/ui-kit-preview/`
- `features/test-auth/`
