"""
Smoke-тест: проверка всех эндпоинтов API.
Запускается автономно (без pytest).

Использование:
  cd backend_python
  python ../tests/scripts/smoke_test.py [--base http://127.0.0.1:8000]
"""
import sys
import time
import argparse

try:
    import httpx
except ImportError:
    print("❌ httpx не установлен. Установи: pip install httpx")
    sys.exit(1)


# =====================================================================
# Конфигурация эндпоинтов
# =====================================================================

# GET-эндпоинты (безопасные, без побочных эффектов)
SAFE_GET_ENDPOINTS = [
    # Путь, ожидаемый статус, описание
    ("/api/projects/", [200], "Список проектов"),
    ("/api/tags/", [200], "Список тегов"),
    ("/api/ai-presets/", [200], "AI-пресеты"),
    ("/api/global-variables/", [200], "Глобальные переменные"),
    ("/api/lists/", [200, 401], "Системные списки"),
    ("/api/system-accounts/", [200, 401], "Системные аккаунты"),
]

# POST-эндпоинты (проверяем что не 500, ожидаем 422 без тела)
VALIDATION_ENDPOINTS = [
    ("/api/projects/", [422, 401], "Создание проекта (пустое тело)"),
    ("/api/posts/", [422, 401], "Создание поста (пустое тело)"),
    ("/api/tags/", [422, 401], "Создание тега (пустое тело)"),
    ("/api/notes/", [422, 401], "Создание заметки (пустое тело)"),
]


def run_smoke_test(base_url: str) -> dict:
    """Запускает smoke-тест и возвращает результаты."""

    results = {"passed": 0, "failed": 0, "errors": []}
    client = httpx.Client(base_url=base_url, timeout=10.0)

    print(f"\n{'═' * 60}")
    print(f"  SMOKE-ТЕСТ: {base_url}")
    print(f"{'═' * 60}\n")

    # --- Проверка доступности сервера ---
    print("🔌 ДОСТУПНОСТЬ СЕРВЕРА")
    try:
        r = client.get("/docs")
        print(f"  ✅ Сервер доступен (FastAPI docs: {r.status_code})\n")
    except httpx.ConnectError:
        print(f"  ❌ Сервер недоступен на {base_url}")
        print(f"     Убедись что uvicorn запущен!\n")
        return {"passed": 0, "failed": 1, "errors": ["Сервер недоступен"]}

    # --- GET эндпоинты ---
    print("🌐 GET ЭНДПОИНТЫ (безопасные)")
    for path, expected_statuses, desc in SAFE_GET_ENDPOINTS:
        try:
            start = time.time()
            r = client.get(path)
            elapsed = (time.time() - start) * 1000

            if r.status_code in expected_statuses:
                results["passed"] += 1
                print(f"  ✅ GET {path:<45} {r.status_code} ({elapsed:.0f}ms) — {desc}")
            elif r.status_code == 500:
                results["failed"] += 1
                error_msg = f"GET {path} → 500 Internal Server Error"
                results["errors"].append(error_msg)
                print(f"  ❌ GET {path:<45} {r.status_code} ← СЛОМАН — {desc}")
                # Пытаемся достать текст ошибки
                try:
                    detail = r.json().get("detail", r.text[:200])
                    print(f"     └─ {detail}")
                except Exception:
                    pass
            else:
                results["passed"] += 1
                print(f"  ⚠️  GET {path:<45} {r.status_code} (ожидали {expected_statuses}) — {desc}")
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"GET {path} → Exception: {e}")
            print(f"  ❌ GET {path:<45} ОШИБКА: {e}")

    # --- POST валидация ---
    print(f"\n📝 POST ВАЛИДАЦИЯ (ожидаем 422, не 500)")
    for path, expected_statuses, desc in VALIDATION_ENDPOINTS:
        try:
            start = time.time()
            r = client.post(path, json={})
            elapsed = (time.time() - start) * 1000

            if r.status_code in expected_statuses:
                results["passed"] += 1
                print(f"  ✅ POST {path:<44} {r.status_code} ({elapsed:.0f}ms) — {desc}")
            elif r.status_code == 500:
                results["failed"] += 1
                error_msg = f"POST {path} → 500 (ожидали {expected_statuses})"
                results["errors"].append(error_msg)
                print(f"  ❌ POST {path:<44} {r.status_code} ← СЛОМАН — {desc}")
                try:
                    detail = r.json().get("detail", r.text[:200])
                    print(f"     └─ {detail}")
                except Exception:
                    pass
            else:
                results["passed"] += 1
                print(f"  ⚠️  POST {path:<44} {r.status_code} (ожидали {expected_statuses}) — {desc}")
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"POST {path} → Exception: {e}")
            print(f"  ❌ POST {path:<44} ОШИБКА: {e}")

    client.close()

    # --- Вердикт ---
    total = results["passed"] + results["failed"]
    print(f"\n{'═' * 60}")
    if results["failed"] == 0:
        print(f"  ✅ ВЕРДИКТ: Все {total} проверок пройдены")
    else:
        print(f"  ❌ ВЕРДИКТ: {results['failed']} из {total} проверок провалены")
        print(f"\n  Проблемы:")
        for i, err in enumerate(results["errors"], 1):
            print(f"    {i}. {err}")
    print(f"{'═' * 60}\n")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Smoke-тест API эндпоинтов")
    parser.add_argument("--base", default="http://127.0.0.1:8000", help="Base URL сервера")
    args = parser.parse_args()

    results = run_smoke_test(args.base)
    sys.exit(1 if results["failed"] > 0 else 0)
