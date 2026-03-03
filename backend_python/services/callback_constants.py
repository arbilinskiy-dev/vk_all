"""
Константы для настройки VK Callback API.

Содержит URL-адреса серверов, имена серверов VK, список событий Callback API
и словарь событий по умолчанию.
"""

# ─── URL-адреса ───────────────────────────────────────────────────

# URL продакшен/предпрод VM
VM_CALLBACK_URL = "https://api.dosmmit.ru/api/vk/callback"

# URL для SSH tunnel (через VM, без ngrok)
# Nginx на VM проксирует /api/vk/callback-local → localhost:8001 (SSH reverse tunnel → локалка:8000)
VM_TUNNEL_CALLBACK_URL = "https://api.dosmmit.ru/api/vk/callback-local"

# ─── Названия серверов ────────────────────────────────────────────

# Названия серверов в VK (макс. 14 символов)
SERVER_NAME_PROD = "smmit"
SERVER_NAME_LOCAL = "smmitloc"

# ─── Ngrok ────────────────────────────────────────────────────────

# Ngrok API для автодетекта туннелей
NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels"

# =============================================================================
# Параметры, которые ПРИНИМАЕТ VK API groups.setCallbackSettings
# Документация: https://dev.vk.com/ru/method/groups.setCallbackSettings
#
# ВНИМАНИЕ: некоторые события (vkpay_transaction, app_payload) VK присылает
# в callback, но они НЕ являются параметрами setCallbackSettings
# (всегда включены автоматически).
# wall_schedule_post_new/delete — настраиваемые через API.
# =============================================================================

VK_SETTABLE_EVENTS = [
    # Сообщения
    "message_new",
    "message_reply",
    "message_edit",
    "message_allow",
    "message_deny",
    "message_typing_state",
    "message_read",
    "message_event",
    "message_reaction_event",
    # Стена
    "wall_post_new",
    "wall_repost",
    "wall_schedule_post_new",
    "wall_schedule_post_delete",
    # Комментарии на стене
    "wall_reply_new",
    "wall_reply_edit",
    "wall_reply_delete",
    "wall_reply_restore",
    # Фото
    "photo_new",
    "photo_comment_new",
    "photo_comment_edit",
    "photo_comment_delete",
    "photo_comment_restore",
    # Аудио
    "audio_new",
    # Видео
    "video_new",
    "video_comment_new",
    "video_comment_edit",
    "video_comment_delete",
    "video_comment_restore",
    # Обсуждения
    "board_post_new",
    "board_post_edit",
    "board_post_restore",
    "board_post_delete",
    # Товары
    "market_comment_new",
    "market_comment_edit",
    "market_comment_delete",
    "market_comment_restore",
    "market_order_new",
    "market_order_edit",
    # Опросы
    "poll_vote_new",
    # Сообщество
    "group_join",
    "group_leave",
    "group_change_settings",
    "group_change_photo",
    "group_officers_edit",
    # Пользователи
    "user_block",
    "user_unblock",
    # Лайки
    "like_add",
    "like_remove",
    # Лид-формы
    "lead_forms_new",
    # VK Donut
    "donut_subscription_create",
    "donut_subscription_prolonged",
    "donut_subscription_cancelled",
    "donut_subscription_price_changed",
    "donut_subscription_expired",
    "donut_money_withdraw",
    "donut_money_withdraw_error",
]

# События, которые VK присылает всегда (не настраиваются через setCallbackSettings)
VK_ALWAYS_ON_EVENTS = [
    "vkpay_transaction",
    "app_payload",
]

# Словарь всех событий = 1 (для обратной совместимости)
DEFAULT_CALLBACK_EVENTS = {event: 1 for event in VK_SETTABLE_EVENTS}
