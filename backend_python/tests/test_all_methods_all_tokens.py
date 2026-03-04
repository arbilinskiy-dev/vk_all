"""
=================================================================
ПОЛНОЕ ФАКТИЧЕСКОЕ ИССЛЕДОВАНИЕ: 
VK API метод × тип токена → работает / не работает

Тестирует ВСЕ используемые в системе VK API методы 
с КАЖДЫМ доступным типом токена:
  1. ENV User Token (standalone)
  2. System Account Tokens (admin/non-admin) — расшифрованные из БД
  3. Community Token (токен группы-владельца)
  4. Community Token (чужой группы)
  5. Service Key

Используем БЕЗОПАСНЫЕ read-only вызовы с минимальными параметрами.
Запуск: python tests/test_all_methods_all_tokens.py
=================================================================
"""

import sys, os, json, time, datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from config import settings
from database import SessionLocal
from models_library.system_accounts import SystemAccount
from models_library.projects import Project
from cryptography.fernet import Fernet

# =================================================================
# КОНФИГУРАЦИЯ
# =================================================================

VK_API_VERSION = "5.199"
VK_API_URL = "https://api.vk.com/method/"

# Тестовый пост: wall-203623179_16129 (КЛЮЧИНИМ Белгород)
TEST_GROUP_ID = 203623179
TEST_OWNER_ID = -203623179
TEST_POST_ID = 16129

# =================================================================
# 1. СБОР ВСЕХ ТОКЕНОВ
# =================================================================

def collect_tokens():
    """Собирает все доступные токены из .env и БД."""
    tokens = {}
    db = SessionLocal()
    
    # 1. ENV User Token
    tokens["ENV_USER"] = {
        "token": settings.vk_user_token,
        "label": "ENV User Token (standalone)",
        "type": "user"
    }
    
    # 2. Service Key
    if settings.vk_service_key:
        tokens["SERVICE_KEY"] = {
            "token": settings.vk_service_key,
            "label": "Service Key",
            "type": "service"
        }
    
    # 3. System Account Tokens (расшифровка Fernet)
    cipher = None
    if settings.encryption_key:
        try:
            cipher = Fernet(settings.encryption_key)
        except Exception:
            pass
    
    accounts = db.query(SystemAccount).filter(
        SystemAccount.status == "active",
        SystemAccount.token.isnot(None)
    ).all()
    
    for acc in accounts:
        raw_token = acc.token
        if not raw_token:
            continue
        # Расшифровка
        if cipher and raw_token.startswith("gAAAAA"):
            try:
                raw_token = cipher.decrypt(raw_token.encode("utf-8")).decode("utf-8")
            except Exception:
                continue
        if not raw_token.startswith("vk1."):
            continue
        
        key = f"SYS_{acc.vk_user_id}"
        tokens[key] = {
            "token": raw_token,
            "label": f"System: {acc.full_name} (vk_id={acc.vk_user_id})",
            "type": "user",
            "vk_user_id": acc.vk_user_id
        }
    
    # 4. Community Tokens — группа КЛЮЧИНИМ (203623179)
    project = db.query(Project).filter(Project.id == str(TEST_GROUP_ID)).first()
    if not project:
        # Пробуем vkProjectId
        project = db.query(Project).filter(
            Project.vkGroupName.like("%КЛЮЧИНИМ%")
        ).first()
    
    if project and project.communityToken:
        tokens["COMMUNITY_OWN"] = {
            "token": project.communityToken,
            "label": f"Community Token (КЛЮЧИНИМ, g={TEST_GROUP_ID})",
            "type": "community",
            "group_id": TEST_GROUP_ID
        }
        extras_raw = project.additional_community_tokens
        if extras_raw:
            extras = json.loads(extras_raw) if isinstance(extras_raw, str) else []
            for i, et in enumerate(extras):
                if et:
                    tokens[f"COMMUNITY_OWN_EXTRA_{i}"] = {
                        "token": et,
                        "label": f"Community Extra[{i}] (КЛЮЧИНИМ)",
                        "type": "community",
                        "group_id": TEST_GROUP_ID
                    }
    
    # 5. Community Token чужой группы (первая другая с токеном)
    other_projects = db.query(Project).filter(
        Project.communityToken.isnot(None),
        Project.communityToken != "",
        ~Project.vkGroupName.like("%КЛЮЧИНИМ%")
    ).all()
    
    for op in other_projects:
        if op.communityToken and op.communityToken.startswith("vk1."):
            tokens["COMMUNITY_OTHER"] = {
                "token": op.communityToken,
                "label": f"Community Token OTHER ({op.vkGroupName[:30]})",
                "type": "community",
                "group_id": getattr(op, "id", "?")
            }
            break
    
    # 6. VK OAuth User Token (если есть)
    try:
        from models_library.vk_users import VkUser
        vk_user = db.query(VkUser).first()
        if vk_user and vk_user.access_token:
            tokens["OAUTH_USER"] = {
                "token": vk_user.access_token,
                "label": f"OAuth User (vk_id={vk_user.vk_user_id}, scope={vk_user.scope})",
                "type": "user"
            }
    except Exception:
        pass
    
    db.close()
    return tokens


# =================================================================
# 2. ОПРЕДЕЛЯЕМ ВСЕ МЕТОДЫ ДЛЯ ТЕСТИРОВАНИЯ
# =================================================================

def get_test_methods():
    """Возвращает все VK API методы с безопасными read-only параметрами."""
    return [
        # --- USERS ---
        {
            "method": "users.get",
            "params": {"user_ids": "1"},
            "category": "Users",
            "note": "Базовая инфо о пользователе"
        },
        {
            "method": "users.get",
            "params": {"user_ids": "1", "fields": "city,sex,bdate,domain,photo_100"},
            "category": "Users",
            "note": "С доп. полями (fields)"
        },
        
        # --- WALL ---
        {
            "method": "wall.get",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "2"},
            "category": "Wall",
            "note": "Получить посты стены"
        },
        {
            "method": "wall.get",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "1", "filter": "postponed"},
            "category": "Wall",
            "note": "Отложенные посты"
        },
        {
            "method": "wall.getById",
            "params": {"posts": f"{TEST_OWNER_ID}_{TEST_POST_ID}"},
            "category": "Wall",
            "note": "Пост по ID"
        },
        {
            "method": "wall.getComments",
            "params": {"owner_id": str(TEST_OWNER_ID), "post_id": str(TEST_POST_ID), "count": "5"},
            "category": "Wall",
            "note": "Комментарии к посту"
        },
        {
            "method": "wall.getReposts",
            "params": {"owner_id": str(TEST_OWNER_ID), "post_id": str(TEST_POST_ID), "count": "5"},
            "category": "Wall",
            "note": "Репосты"
        },
        {
            "method": "wall.search",
            "params": {"owner_id": str(TEST_OWNER_ID), "query": "ключ", "count": "2"},
            "category": "Wall",
            "note": "Поиск по стене"
        },
        
        # --- GROUPS ---
        {
            "method": "groups.getById",
            "params": {"group_id": str(TEST_GROUP_ID)},
            "category": "Groups",
            "note": "Информация о группе"
        },
        {
            "method": "groups.getMembers",
            "params": {"group_id": str(TEST_GROUP_ID), "count": "3"},
            "category": "Groups",
            "note": "Участники группы"
        },
        {
            "method": "groups.isMember",
            "params": {"group_id": str(TEST_GROUP_ID), "user_id": "1"},
            "category": "Groups",
            "note": "Проверка членства"
        },
        {
            "method": "groups.get",
            "params": {"filter": "admin", "count": "3"},
            "category": "Groups",
            "note": "Группы пользователя (filter=admin)"
        },
        {
            "method": "groups.getCallbackServers",
            "params": {"group_id": str(TEST_GROUP_ID)},
            "category": "Groups",
            "note": "Callback-серверы"
        },
        
        # --- LIKES ---
        {
            "method": "likes.getList",
            "params": {"type": "post", "owner_id": str(TEST_OWNER_ID), "item_id": str(TEST_POST_ID), "count": "5"},
            "category": "Likes",
            "note": "Список лайков"
        },
        
        # --- PHOTOS ---
        {
            "method": "photos.getAlbums",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "3"},
            "category": "Photos",
            "note": "Альбомы"
        },
        {
            "method": "photos.get",
            "params": {"owner_id": str(TEST_OWNER_ID), "album_id": "wall", "count": "2"},
            "category": "Photos",
            "note": "Фото со стены"
        },
        
        # --- VIDEO ---
        {
            "method": "video.get",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "2"},
            "category": "Video",
            "note": "Видео"
        },
        
        # --- MESSAGES (только community token) ---
        {
            "method": "messages.getConversations",
            "params": {"count": "1"},
            "category": "Messages",
            "note": "Диалоги (нужен community token)"
        },
        
        # --- STORIES ---
        {
            "method": "stories.get",
            "params": {"owner_id": str(TEST_OWNER_ID)},
            "category": "Stories",
            "note": "Истории группы"
        },
        
        # --- MARKET ---
        {
            "method": "market.get",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "2"},
            "category": "Market",
            "note": "Товары"
        },
        {
            "method": "market.getAlbums",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "3"},
            "category": "Market",
            "note": "Подборки товаров"
        },
        {
            "method": "market.getCategories",
            "params": {"count": "3"},
            "category": "Market",
            "note": "Категории товаров"
        },
        
        # --- UTILS ---
        {
            "method": "utils.resolveScreenName",
            "params": {"screen_name": "durov"},
            "category": "Utils",
            "note": "Резолв screen name"
        },
        {
            "method": "utils.getServerTime",
            "params": {},
            "category": "Utils",
            "note": "Серверное время"
        },
        
        # --- FRIENDS ---
        {
            "method": "friends.get",
            "params": {"user_id": "1", "count": "3"},
            "category": "Friends",
            "note": "Друзья пользователя"
        },
        
        # --- EXECUTE ---
        {
            "method": "execute",
            "params": {"code": 'return API.users.get({"user_ids": "1"});'},
            "category": "Execute",
            "note": "Execute (users.get)"
        },
        {
            "method": "execute",
            "params": {"code": f'return API.wall.get({{"owner_id": {TEST_OWNER_ID}, "count": 1}});'},
            "category": "Execute",
            "note": "Execute (wall.get)"
        },
        
        # --- POLLS ---
        {
            "method": "polls.getById",
            "params": {"owner_id": str(TEST_OWNER_ID), "poll_id": "1"},
            "category": "Polls",
            "note": "Опрос по ID (ожидаем ошибку — нет реального poll_id)"
        },
        
        # --- NEWSFEED ---
        {
            "method": "newsfeed.search",
            "params": {"q": "ключиним белгород", "count": "2"},
            "category": "Newsfeed",
            "note": "Поиск по лентам новостей"
        },
        
        # --- DOCS ---
        {
            "method": "docs.get",
            "params": {"owner_id": str(TEST_OWNER_ID), "count": "2"},
            "category": "Docs",
            "note": "Документы"
        },
        
        # --- SECURE ---
        {
            "method": "secure.checkToken",
            "params": {},
            "category": "Secure",
            "note": "Проверка токена (secure.*)"
        },
        
        # --- DATABASE ---
        {
            "method": "database.getCities",
            "params": {"country_id": "1", "q": "Москва", "count": "3"},
            "category": "Database",
            "note": "Поиск городов"
        },
    ]


# =================================================================
# 3. ТЕСТИРОВАНИЕ
# =================================================================

def call_vk(method: str, params: dict, token: str) -> dict:
    """Вызывает VK API и возвращает результат."""
    payload = params.copy()
    payload["access_token"] = token
    payload["v"] = VK_API_VERSION
    
    try:
        resp = requests.post(f"{VK_API_URL}{method}", data=payload, timeout=15)
        return resp.json()
    except Exception as e:
        return {"error": {"error_code": -1, "error_msg": str(e)}}


def classify_result(data: dict) -> tuple:
    """Классифицирует результат: (status, detail)."""
    if "error" in data:
        err = data["error"]
        code = err.get("error_code", "?")
        msg = err.get("error_msg", "?")
        
        # Известные коды
        if code == 5:
            return "AUTH_ERROR", f"Code 5: Invalid token"
        elif code == 7:
            return "NO_PERMISSION", f"Code 7: No permission"
        elif code == 15:
            return "ACCESS_DENIED", f"Code 15: Access denied"
        elif code == 27:
            return "GROUP_AUTH_ONLY", f"Code 27: Only for community token"
        elif code == 100:
            return "PARAM_ERROR", f"Code 100: {msg[:60]}"
        elif code == 113:
            return "INVALID_USER", f"Code 113: Invalid user id"
        elif code == 1051:
            return "PROFILE_TYPE", f"Code 1051: Wrong profile type"
        elif code == 203:
            return "GROUP_ACCESS", f"Code 203: No group access"
        elif code == 917:
            return "NO_MSG_PERM", f"Code 917: No messages permission"
        elif code == 6:
            return "RATE_LIMIT", f"Code 6: Rate limit"
        else:
            return "ERROR", f"Code {code}: {msg[:80]}"
    
    resp = data.get("response", None)
    if resp is None:
        return "EMPTY", "No response"
    
    # Проверяем что есть данные
    if isinstance(resp, dict):
        items = resp.get("items", resp.get("count", None))
        if items is not None:
            count = items if isinstance(items, int) else len(items) if isinstance(items, list) else "?"
            return "OK", f"items/count={count}"
        return "OK", f"keys={list(resp.keys())[:5]}"
    elif isinstance(resp, list):
        return "OK", f"list[{len(resp)}]"
    elif isinstance(resp, (int, float)):
        return "OK", f"value={resp}"
    
    return "OK", str(resp)[:60]


def run_full_test():
    print("=" * 100)
    print("ПОЛНОЕ ИССЛЕДОВАНИЕ: VK API МЕТОДЫ × ТИПЫ ТОКЕНОВ")
    print(f"Дата: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Тестовая группа: {TEST_GROUP_ID} (КЛЮЧИНИМ)")
    print(f"Тестовый пост: wall{TEST_OWNER_ID}_{TEST_POST_ID}")
    print("=" * 100)
    
    # Сбор токенов
    print("\n📦 Собираем токены...")
    tokens = collect_tokens()
    
    print(f"\nНайдено {len(tokens)} токенов:")
    for key, info in tokens.items():
        tp = info["token"][:15] + "..." if len(info["token"]) > 15 else info["token"]
        print(f"  [{key}] {info['label']} → {tp}")
    
    # Для сводной таблицы выбираем по одному представителю каждого типа
    # Собираем "компактный" набор — максимум 6 токенов
    compact_keys = []
    
    # ENV User
    if "ENV_USER" in tokens:
        compact_keys.append("ENV_USER")
    
    # Один system account (первый active)
    sys_keys = [k for k in tokens if k.startswith("SYS_")]
    if sys_keys:
        compact_keys.append(sys_keys[0])
    
    # Community Own
    if "COMMUNITY_OWN" in tokens:
        compact_keys.append("COMMUNITY_OWN")
    
    # Community Other
    if "COMMUNITY_OTHER" in tokens:
        compact_keys.append("COMMUNITY_OTHER")
    
    # OAuth User
    if "OAUTH_USER" in tokens:
        compact_keys.append("OAUTH_USER")
    
    # Service Key
    if "SERVICE_KEY" in tokens:
        compact_keys.append("SERVICE_KEY")
    
    print(f"\n🔬 Тестируем с {len(compact_keys)} токенами × {len(get_test_methods())} методов")
    print(f"   Токены: {', '.join(compact_keys)}")
    
    methods = get_test_methods()
    results = []  # [(method_label, {token_key: (status, detail)})]
    
    for mi, m in enumerate(methods):
        method = m["method"]
        params = m["params"]
        note = m["note"]
        method_label = f"{method} ({note})"
        
        print(f"\n[{mi+1}/{len(methods)}] {method_label}")
        
        row = {}
        for tk in compact_keys:
            token = tokens[tk]["token"]
            data = call_vk(method, params, token)
            status, detail = classify_result(data)
            row[tk] = (status, detail)
            
            icon = "✅" if status == "OK" else "⚠️" if status in ("RATE_LIMIT", "PARAM_ERROR") else "❌"
            print(f"  {icon} {tk:20s} → {status:17s} | {detail}")
            
            # Anti-rate-limit
            time.sleep(0.35)
        
        results.append((method_label, row))
    
    # =================================================================
    # 4. СВОДНАЯ ТАБЛИЦА
    # =================================================================
    
    print("\n\n")
    print("=" * 140)
    print("СВОДНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ")
    print("=" * 140)
    
    # Заголовок
    header = f"{'Метод':<45s}"
    for tk in compact_keys:
        short = tk[:14]
        header += f" | {short:^14s}"
    print(header)
    print("-" * 140)
    
    current_category = ""
    for method_label, row in results:
        # Категория
        cat = method_label.split("(")[0].strip().split(".")[0] if "." in method_label else ""
        
        line = f"{method_label[:44]:<45s}"
        for tk in compact_keys:
            status, detail = row.get(tk, ("?", "?"))
            if status == "OK":
                cell = "✅ OK"
            elif status == "RATE_LIMIT":
                cell = "⏳ RATE"
            elif status == "PARAM_ERROR":
                cell = "⚠️ PARAM"
            elif status == "AUTH_ERROR":
                cell = "🔑 AUTH"
            elif status == "NO_PERMISSION":
                cell = "🚫 PERM"
            elif status == "ACCESS_DENIED":
                cell = "🚫 DENY"
            elif status == "GROUP_AUTH_ONLY":
                cell = "👥 GRP27"
            elif status == "PROFILE_TYPE":
                cell = "🔒 1051"
            elif status == "GROUP_ACCESS":
                cell = "🏢 203"
            elif status == "NO_MSG_PERM":
                cell = "💬 917"
            else:
                cell = f"❌ {status[:8]}"
            
            line += f" | {cell:^14s}"
        print(line)
    
    print("=" * 140)
    
    # Легенда
    print("\n📋 ЛЕГЕНДА:")
    print("  ✅ OK          — Метод работает с этим токеном")
    print("  🔑 AUTH        — Code 5: Невалидный/протухший токен")
    print("  🚫 PERM        — Code 7: Нет прав для этого метода")
    print("  🚫 DENY        — Code 15: Доступ запрещён")
    print("  👥 GRP27       — Code 27: Метод только для community token")
    print("  🔒 1051        — Code 1051: Неправильный тип профиля (не для service key)")
    print("  🏢 203         — Code 203: Нет доступа к группе")
    print("  💬 917         — Code 917: Нет прав на сообщения")
    print("  ⚠️ PARAM       — Code 100: Ошибка параметров")
    print("  ⏳ RATE        — Code 6: Слишком много запросов")
    
    # =================================================================
    # 5. ПОЛНЫЙ JSON-ОТЧЁТ  
    # =================================================================
    
    report = {
        "date": datetime.datetime.now().isoformat(),
        "test_group_id": TEST_GROUP_ID,
        "test_post": f"wall{TEST_OWNER_ID}_{TEST_POST_ID}",
        "tokens_used": {k: {"label": tokens[k]["label"], "type": tokens[k]["type"]} for k in compact_keys},
        "results": []
    }
    for method_label, row in results:
        entry = {"method": method_label, "tokens": {}}
        for tk in compact_keys:
            status, detail = row.get(tk, ("?", "?"))
            entry["tokens"][tk] = {"status": status, "detail": detail}
        report["results"].append(entry)
    
    report_path = os.path.join(os.path.dirname(__file__), "vk_api_token_compatibility.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n💾 JSON-отчёт сохранён: {report_path}")
    
    print("\n✅ ИССЛЕДОВАНИЕ ЗАВЕРШЕНО")


if __name__ == "__main__":
    run_full_test()
