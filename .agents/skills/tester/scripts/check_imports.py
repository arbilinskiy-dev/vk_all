"""
Проверка импортов: все .py модули в указанной папке импортируются без ошибок.
Ловит: ImportError, SyntaxError, циклические зависимости.

Использование:
  cd backend_python
  python ../tests/scripts/check_imports.py [путь_к_папке]
  
Примеры:
  python ../tests/scripts/check_imports.py services/automations
  python ../tests/scripts/check_imports.py routers
  python ../tests/scripts/check_imports.py .          # весь backend_python
"""
import os
import sys
import importlib
import traceback
import argparse
from pathlib import Path


def find_python_modules(base_dir: str) -> list[tuple[str, str]]:
    """
    Находит все .py файлы и возвращает (module_path, file_path).
    Пропускает __pycache__, __init__.py, тестовые файлы.
    """
    modules = []
    base = Path(base_dir).resolve()

    for py_file in base.rglob("*.py"):
        # Пропускаем
        if "__pycache__" in str(py_file):
            continue
        if py_file.name == "__init__.py":
            continue
        if py_file.name.startswith("test_"):
            continue

        # Строим путь модуля относительно cwd
        try:
            rel = py_file.relative_to(Path.cwd())
            module_path = str(rel).replace(os.sep, ".").replace(".py", "")
            modules.append((module_path, str(py_file)))
        except ValueError:
            continue

    return sorted(modules)


def check_imports(base_dir: str) -> dict:
    """Проверяет импорты всех модулей в директории."""

    modules = find_python_modules(base_dir)

    if not modules:
        print(f"⚠️  Не найдено .py файлов в {base_dir}")
        return {"passed": 0, "failed": 0, "errors": []}

    results = {"passed": 0, "failed": 0, "errors": []}

    print(f"\n{'═' * 60}")
    print(f"  ПРОВЕРКА ИМПОРТОВ: {base_dir}")
    print(f"  Найдено модулей: {len(modules)}")
    print(f"{'═' * 60}\n")

    for module_path, file_path in modules:
        try:
            # Если модуль уже загружен — перезагружаем
            if module_path in sys.modules:
                importlib.reload(sys.modules[module_path])
            else:
                importlib.import_module(module_path)

            results["passed"] += 1
            print(f"  ✅ {module_path}")

        except ImportError as e:
            results["failed"] += 1
            error = f"{module_path} — ImportError: {e}"
            results["errors"].append(error)
            print(f"  ❌ {module_path}")
            print(f"     └─ ImportError: {e}")

        except SyntaxError as e:
            results["failed"] += 1
            error = f"{module_path} — SyntaxError: {e.msg} (line {e.lineno})"
            results["errors"].append(error)
            print(f"  ❌ {module_path}")
            print(f"     └─ SyntaxError: {e.msg} (строка {e.lineno})")

        except Exception as e:
            results["failed"] += 1
            error = f"{module_path} — {type(e).__name__}: {e}"
            results["errors"].append(error)
            print(f"  ❌ {module_path}")
            print(f"     └─ {type(e).__name__}: {e}")

    # Вердикт
    total = results["passed"] + results["failed"]
    print(f"\n{'═' * 60}")
    if results["failed"] == 0:
        print(f"  ✅ ВЕРДИКТ: Все {total} модулей импортируются корректно")
    else:
        print(f"  ❌ ВЕРДИКТ: {results['failed']} из {total} модулей с ошибками")
        print(f"\n  Проблемы:")
        for i, err in enumerate(results["errors"], 1):
            print(f"    {i}. {err}")
    print(f"{'═' * 60}\n")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Проверка импортов Python-модулей")
    parser.add_argument("path", nargs="?", default=".", help="Путь к папке для проверки")
    args = parser.parse_args()

    # Добавляем текущую директорию в path
    if os.getcwd() not in sys.path:
        sys.path.insert(0, os.getcwd())

    results = check_imports(args.path)
    sys.exit(1 if results["failed"] > 0 else 0)
