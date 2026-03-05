
# Этот файл выступает в роли единой точки входа (хаба) для всех моделей SQLAlchemy.
# Он импортирует Base и все модели из подмодулей в `models_library`.
# Это обеспечивает совместимость с существующим кодом, который делает `import models`.

from database import Base

# Импорт ассоциативных таблиц
from models_library.associations import (
    published_post_tags_association,
    scheduled_post_tags_association
)

# Импорт моделей
from models_library.projects import Project, User, ProjectContextField, ProjectContextValue, ProjectContextFieldVisibility
from models_library.tags import Tag
from models_library.posts import Post, ScheduledPost, SystemPost, SuggestedPost, Note
from models_library.media import Album, Photo
from models_library.settings import AiPromptPreset, GlobalVariableDefinition, ProjectGlobalVariableValue
from models_library.market import MarketCategory, MarketAlbum, MarketItem
from models_library.lists import (
    ProjectListMeta,
    SystemListPost,
)
# Обновленный импорт: SystemAccount и TokenLog теперь тоже живут в system.py вместе с SystemTask
from models_library.system import SystemAccount, TokenLog, SystemTask
from models_library.logs import VkCallbackLog
# Новая модель AI токенов
from models_library.ai_tokens import AiToken, AiTokenLog
# Новая модель автоматизаций (Добавлен ReviewContestEntry и ReviewContestDeliveryLog и StoriesAutomation)
from models_library.automations import (
    ReviewContest, 
    PromoCode, 
    ReviewContestEntry, 
    ReviewContestDeliveryLog, 
    ReviewContestBlacklist,
    StoriesAutomation,
    StoriesAutomationLog
)
# NEW: Администрируемые группы
from models_library.admin_tools import AdministeredGroup
# NEW: VK Пользователи (авторизованные через OAuth)
from models_library.vk_users import VkUser
# NEW: Глобальные профили VK-пользователей (Фаза 1 рефакторинга БД)
from models_library.vk_profiles import VkProfile
# NEW: Нормализованные участники проектов (Фаза 2 рефакторинга БД)
from models_library.members import ProjectMember, MemberEvent
# NEW: Нормализованные взаимодействия с постами (Фаза 3 рефакторинга БД)
from models_library.interactions import PostInteraction
# NEW: Нормализованные диалоги и авторы (Фаза 4 рефакторинга БД)
from models_library.dialogs_authors import ProjectDialog, ProjectAuthor
# NEW: Конкурс 2.0
from models_library.contest_v2 import ContestV2
# NEW: Кэш сообщений
from models_library.messages import CachedMessage, MessageCacheMeta
# NEW: Статусы прочтения диалогов
from models_library.message_read_status import MessageReadStatus
# NEW: Статистика нагрузки сообщений
from models_library.message_stats import MessageStatsHourly, MessageStatsUser
# NEW: Авторизация — сессии и логи
from models_library.auth import AuthSession, AuthLog
# NEW: Шаблоны ответов для сообщений
from models_library.message_templates import MessageTemplate
# NEW: Списки промокодов для шаблонов сообщений
from models_library.promo_lists import PromoList, PromoListCode
# NEW: Метки (ярлыки) диалогов
from models_library.dialog_labels import DialogLabel, DialogLabelAssignment
# NEW: Роли пользователей и лог действий
from models_library.user_roles import UserRole
from models_library.user_actions import UserAction
# NEW: DLVRY заказы (внешняя CRM — приём вебхуков от DLVRY)
from models_library.dlvry_orders import DlvryOrder, DlvryOrderItem, DlvryWebhookLog
# NEW: История вступлений/выходов пользователей (аналитический лог)
from models_library.membership_history import UserMembershipHistory
