"""
Локальный лаунчер VK Content Planner Backend.

Запускает несколько процессов для имитации продакшен-окружения:
  - 2+ uvicorn воркера для API (через uvicorn --workers)
  - 1 выделенный процесс для VK Callback Worker

Использование:
    cd backend_python
    python start_local.py

Параметры через переменные окружения:
    API_WORKERS=2       — количество API-воркеров (по умолчанию 2)
    API_PORT=8000       — порт API-сервера (по умолчанию 8000)
    API_HOST=127.0.0.1  — хост API-сервера (по умолчанию 127.0.0.1)
"""

import subprocess
import sys
import os
import signal
import time
import platform

# ─── Конфигурация ─────────────────────────────────────────────────
API_WORKERS = int(os.getenv("API_WORKERS", "2"))
API_PORT = int(os.getenv("API_PORT", "8000"))
API_HOST = os.getenv("API_HOST", "127.0.0.1")

# ─── Глобальные переменные ────────────────────────────────────────
_processes: list[subprocess.Popen] = []
_shutting_down = False


def _banner():
    """Вывод баннера при старте."""
    print()
    print("=" * 60)
    print("  VK Content Planner — Локальный запуск")
    print("=" * 60)
    print(f"  API воркеры:       {API_WORKERS}")
    print(f"  API адрес:         http://{API_HOST}:{API_PORT}")
    print(f"  Callback Worker:   отдельный процесс")
    print(f"  ОС:               {platform.system()} {platform.release()}")
    print(f"  Python:            {sys.version.split()[0]}")
    print("=" * 60)
    print()


def _graceful_shutdown(signum=None, frame=None):
    """Корректное завершение всех дочерних процессов."""
    global _shutting_down
    if _shutting_down:
        return
    _shutting_down = True

    print()
    print("=" * 60)
    print("  Завершение всех процессов...")
    print("=" * 60)

    for proc in reversed(_processes):
        if proc.poll() is None:
            try:
                proc.terminate()
                print(f"  → Остановка PID {proc.pid} ({proc.args[0] if isinstance(proc.args, list) else 'process'})...")
            except Exception as e:
                print(f"  ⚠ Ошибка при остановке PID {proc.pid}: {e}")

    # Даём время на graceful shutdown
    deadline = time.time() + 10
    for proc in _processes:
        remaining = max(0, deadline - time.time())
        try:
            proc.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            print(f"  ⚠ Принудительное завершение PID {proc.pid}")
            proc.kill()

    print("  Все процессы остановлены.")
    print("=" * 60)


def _start_api_server() -> subprocess.Popen:
    """Запуск uvicorn API-сервера с несколькими воркерами."""
    # Передаём DISABLE_EMBEDDED_CALLBACK=true, чтобы встроенный callback worker
    # не запускался внутри API-воркеров (он идёт отдельным процессом)
    env = os.environ.copy()
    env["DISABLE_EMBEDDED_CALLBACK"] = "true"

    cmd = [
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--host", API_HOST,
        "--port", str(API_PORT),
        "--workers", str(API_WORKERS),
    ]

    print(f"  [API] Запуск: {' '.join(cmd)}")
    print(f"  [API] Воркеры: {API_WORKERS}, Порт: {API_PORT}")
    print(f"  [API] DISABLE_EMBEDDED_CALLBACK=true")
    print()

    proc = subprocess.Popen(
        cmd,
        env=env,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    return proc


def _start_callback_worker() -> subprocess.Popen:
    """Запуск VK Callback Worker как отдельного процесса."""
    env = os.environ.copy()

    cmd = [
        sys.executable, "-m", "services.vk_callback.worker",
    ]

    print(f"  [CALLBACK] Запуск: {' '.join(cmd)}")
    print()

    proc = subprocess.Popen(
        cmd,
        env=env,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    return proc


def main():
    """Главная точка входа."""
    _banner()

    # Регистрируем обработчик для корректного завершения
    signal.signal(signal.SIGINT, _graceful_shutdown)
    signal.signal(signal.SIGTERM, _graceful_shutdown)
    # На Windows также перехватываем CTRL_BREAK_EVENT
    if platform.system() == "Windows":
        signal.signal(signal.SIGBREAK, _graceful_shutdown)

    # ─── Запуск процессов ──────────────────────────────────────────
    print("─" * 60)
    print("  Запуск процессов:")
    print("─" * 60)

    # 1. API-сервер (2+ воркера)
    api_proc = _start_api_server()
    _processes.append(api_proc)

    # Небольшая пауза, чтобы API успел стартовать до callback worker
    time.sleep(2)

    # 2. VK Callback Worker (отдельный процесс)
    callback_proc = _start_callback_worker()
    _processes.append(callback_proc)

    print("─" * 60)
    print("  ✅ Все процессы запущены!")
    print(f"  → API:      http://{API_HOST}:{API_PORT}")
    print(f"  → Swagger:  http://{API_HOST}:{API_PORT}/docs")
    print(f"  → Callback Worker: PID {callback_proc.pid}")
    print("─" * 60)
    print("  Нажмите Ctrl+C для остановки всех процессов")
    print("─" * 60)
    print()

    # ─── Мониторинг процессов ──────────────────────────────────────
    try:
        while not _shutting_down:
            # Проверяем, не упал ли какой-то процесс
            for i, proc in enumerate(_processes):
                if proc.poll() is not None:
                    name = "API" if i == 0 else "Callback Worker"
                    exit_code = proc.returncode
                    print(f"\n  ⚠ Процесс [{name}] завершился с кодом {exit_code}")

                    if not _shutting_down:
                        # Перезапускаем упавший процесс
                        print(f"  → Перезапуск [{name}]...")
                        if i == 0:
                            new_proc = _start_api_server()
                        else:
                            new_proc = _start_callback_worker()
                        _processes[i] = new_proc
                        print(f"  → [{name}] перезапущен, PID {new_proc.pid}")

            time.sleep(2)

    except KeyboardInterrupt:
        pass
    finally:
        _graceful_shutdown()


if __name__ == "__main__":
    main()
