"""
Persistent Logger — Файловый логгер для критических операций.

Логи пишутся в /app/data/contest_logs/ (Docker named volume `backend_data`).
Этот volume монтируется в docker-compose.yml и СОХРАНЯЕТСЯ при перезапуске контейнера.

Локально (разработка) логи пишутся в ./data/contest_logs/ рядом с проектом.

Каждый файл — один день. Формат: contest_YYYY-MM-DD.log
Ротация: файлы старше 30 дней автоматически удаляются при старте.
"""

import os
import json
import traceback
from datetime import datetime, timezone, timedelta
from pathlib import Path


# === ОПРЕДЕЛЕНИЕ ПУТИ К ЛОГАМ ===
# Docker: /app/data/contest_logs/ (volume backend_data)
# Локально: ./data/contest_logs/
def _resolve_log_dir() -> Path:
    """Определяет директорию для логов на основе окружения."""
    # Docker volume монтируется в /app/data
    docker_path = Path("/app/data/contest_logs")
    if docker_path.parent.exists():
        docker_path.mkdir(parents=True, exist_ok=True)
        return docker_path
    
    # Локальная разработка — рядом с backend_python/
    local_path = Path(__file__).resolve().parent.parent / "data" / "contest_logs"
    local_path.mkdir(parents=True, exist_ok=True)
    return local_path


LOG_DIR = _resolve_log_dir()

# Максимальный возраст логов (дней)
MAX_LOG_AGE_DAYS = 30


def _get_today_log_path() -> Path:
    """Путь к лог-файлу текущего дня."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return LOG_DIR / f"contest_{today}.log"


def _cleanup_old_logs():
    """Удаляет лог-файлы старше MAX_LOG_AGE_DAYS."""
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_LOG_AGE_DAYS)
        for f in LOG_DIR.glob("contest_*.log"):
            # Извлекаем дату из имени файла
            try:
                date_str = f.stem.replace("contest_", "")
                file_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if file_date < cutoff:
                    f.unlink()
            except (ValueError, OSError):
                pass
    except Exception:
        pass


def contest_log(
    project_id: str,
    event: str,
    *,
    details: str = None,
    data: dict = None,
    error: Exception = None,
    level: str = "INFO"
):
    """
    Записывает событие в persistent лог-файл.
    
    Args:
        project_id: ID проекта (VK group ID или internal)
        event: Краткое название события (PROOF_IMAGE_START, DB_COMMIT, etc.)
        details: Подробное текстовое описание
        data: Словарь с дополнительными данными (будет сериализован в JSON)
        error: Объект исключения (если есть — запишет traceback)
        level: Уровень (INFO, WARNING, ERROR, CRITICAL)
    """
    try:
        now = datetime.now(timezone.utc)
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]  # ms precision
        
        # Формируем строку лога
        parts = [
            f"[{timestamp} UTC]",
            f"[{level}]",
            f"[{project_id}]",
            f"{event}"
        ]
        
        if details:
            parts.append(f"| {details}")
        
        line = " ".join(parts)
        
        # Дополнительные данные
        extra_lines = []
        
        if data:
            try:
                data_str = json.dumps(data, ensure_ascii=False, default=str)
                extra_lines.append(f"  DATA: {data_str}")
            except Exception:
                extra_lines.append(f"  DATA: {repr(data)}")
        
        if error:
            extra_lines.append(f"  ERROR: {type(error).__name__}: {error}")
            tb = traceback.format_exception(type(error), error, error.__traceback__)
            for tb_line in tb:
                for sub_line in tb_line.rstrip().split("\n"):
                    extra_lines.append(f"  TB: {sub_line}")
        
        # Записываем в файл (append mode)
        log_path = _get_today_log_path()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            for el in extra_lines:
                f.write(el + "\n")
        
        # Также дублируем в stdout (стандартный Docker лог)
        print(f"CONTEST_LOG: {line}")
        if error:
            print(f"CONTEST_LOG ERROR: {type(error).__name__}: {error}")
    
    except Exception as log_err:
        # Логирование не должно ломать основной поток
        print(f"CONTEST_LOG WRITE FAILED: {log_err}")


def contest_log_separator(project_id: str, title: str = "FINALIZATION START"):
    """Записывает визуальный разделитель в лог (начало новой операции)."""
    contest_log(project_id, f"{'='*60}")
    contest_log(project_id, title)
    contest_log(project_id, f"{'='*60}")


# Очистка старых логов при импорте модуля
try:
    _cleanup_old_logs()
except Exception:
    pass
