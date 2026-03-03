"""
Миксин трекинга фокуса менеджеров в диалогах (Dialog Focus).

Отвечает за:
- Фиксацию входа/выхода менеджера в диалог
- Получение списка менеджеров в диалоге
- Автоочистку при disconnect SSE
- Синхронизацию dialog_focus между воркерами через Redis
"""

import logging
import time
from typing import Dict

from services.sse_event import SSEEvent

logger = logging.getLogger("sse_manager")


class SSEDialogFocusMixin:
    """Миксин: трекинг менеджеров в диалогах."""

    # Атрибуты инициализируются в SSEManager.__init__:
    # _dialog_focus: Dict[Tuple[str, int], Dict[str, dict]]
    # _focus_lock: threading.Lock
    # _queue_meta: Dict[int, dict]

    def set_dialog_focus(self, project_id: str, vk_user_id: int,
                         manager_id: str, manager_name: str) -> None:
        """
        Менеджер открыл диалог — фиксируем в in-memory трекере.
        Публикует SSE-событие dialog_focus (action=enter) всем подписчикам проекта.
        """
        key = (project_id, vk_user_id)
        with self._focus_lock:
            if key not in self._dialog_focus:
                self._dialog_focus[key] = {}
            self._dialog_focus[key][manager_id] = {
                "name": manager_name,
                "ts": time.time(),
            }

        # SSE push через Redis — доставляется всем воркерам (multi-worker)
        self.publish_via_redis(SSEEvent(
            event_type="dialog_focus",
            project_id=project_id,
            data={
                "vk_user_id": vk_user_id,
                "manager_id": manager_id,
                "manager_name": manager_name,
                "action": "enter",
            },
        ))
        logger.info(f"DIALOG FOCUS: {manager_name} открыл диалог user={vk_user_id} project={project_id}")

    def remove_dialog_focus(self, project_id: str, vk_user_id: int,
                            manager_id: str, manager_name: str = "") -> None:
        """
        Менеджер покинул диалог — убираем из трекера.
        Публикует SSE-событие dialog_focus (action=leave).
        """
        key = (project_id, vk_user_id)
        with self._focus_lock:
            if key in self._dialog_focus:
                removed = self._dialog_focus[key].pop(manager_id, None)
                if removed and not manager_name:
                    manager_name = removed.get("name", "")
                if not self._dialog_focus[key]:
                    del self._dialog_focus[key]

        # SSE push через Redis — доставляется всем воркерам (multi-worker)
        self.publish_via_redis(SSEEvent(
            event_type="dialog_focus",
            project_id=project_id,
            data={
                "vk_user_id": vk_user_id,
                "manager_id": manager_id,
                "manager_name": manager_name,
                "action": "leave",
            },
        ))
        logger.info(f"DIALOG FOCUS: {manager_name} покинул диалог user={vk_user_id}")

    def get_dialog_focus(self, project_id: str, vk_user_id: int) -> list:
        """
        Возвращает список менеджеров, которые сейчас в диалоге с пользователем.
        Формат: [{"manager_id": str, "manager_name": str, "ts": float}, ...]
        """
        key = (project_id, vk_user_id)
        with self._focus_lock:
            managers = self._dialog_focus.get(key, {})
            return [
                {"manager_id": mid, "manager_name": info["name"], "ts": info["ts"]}
                for mid, info in managers.items()
            ]

    def get_all_dialog_focuses(self, project_id: str) -> Dict[int, list]:
        """
        Возвращает все активные фокусы для проекта.
        Формат: { vk_user_id → [{"manager_id": str, "manager_name": str}, ...] }
        """
        result: Dict[int, list] = {}
        with self._focus_lock:
            for (pid, uid), managers in self._dialog_focus.items():
                if pid == project_id and managers:
                    result[uid] = [
                        {"manager_id": mid, "manager_name": info["name"]}
                        for mid, info in managers.items()
                    ]
        return result

    def _apply_dialog_focus_from_event(self, event: SSEEvent) -> None:
        """
        Применяет dialog_focus событие к локальному in-memory словарю.
        Вызывается из Redis listener для синхронизации между воркерами/инстансами.
        """
        data = event.data
        vk_user_id = data.get("vk_user_id")
        manager_id = data.get("manager_id")
        manager_name = data.get("manager_name", "")
        action = data.get("action")
        project_id = event.project_id

        if not all([vk_user_id, manager_id, action, project_id]):
            return

        key = (project_id, vk_user_id)
        with self._focus_lock:
            if action == "enter":
                if key not in self._dialog_focus:
                    self._dialog_focus[key] = {}
                self._dialog_focus[key][manager_id] = {
                    "name": manager_name,
                    "ts": time.time(),
                }
            elif action == "leave":
                if key in self._dialog_focus:
                    self._dialog_focus[key].pop(manager_id, None)
                    if not self._dialog_focus[key]:
                        del self._dialog_focus[key]

        logger.info(
            f"DIALOG FOCUS SYNC (Redis): {action} manager={manager_id} "
            f"user={vk_user_id} project={project_id}"
        )

    def _cleanup_focus_for_manager(self, project_id: str, manager_id: str) -> None:
        """
        Убирает менеджера из всех dialog_focus в проекте.
        Вызывается при disconnect SSE (unsubscribe).
        """
        keys_to_notify = []
        with self._focus_lock:
            keys_to_remove = []
            for key, managers in self._dialog_focus.items():
                if key[0] == project_id and manager_id in managers:
                    removed = managers.pop(manager_id)
                    keys_to_notify.append((key[1], removed.get("name", "")))
                    if not managers:
                        keys_to_remove.append(key)
            for k in keys_to_remove:
                del self._dialog_focus[k]

        # Уведомляем остальных менеджеров о leave (через Redis — multi-worker)
        for vk_user_id, name in keys_to_notify:
            self.publish_via_redis(SSEEvent(
                event_type="dialog_focus",
                project_id=project_id,
                data={
                    "vk_user_id": vk_user_id,
                    "manager_id": manager_id,
                    "manager_name": name,
                    "action": "leave",
                },
            ))
            logger.info(f"DIALOG FOCUS: автоочистка {name} при disconnect (user={vk_user_id})")
