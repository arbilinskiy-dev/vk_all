"""
Обёртка для агрегированных данных взаимодействий (PostInteraction).

Проблема: PostInteraction хранит ИНДИВИДУАЛЬНЫЕ события (одна строка = один лайк/коммент/репост).
Но список пользователей во фронтенде показывает АГРЕГАТ: один пользователь + кол-во взаимодействий.

Решение: Этот класс оборачивает (VkProfile + агрегированные счётчики) в объект,
совместимый с Pydantic from_attributes=True и существующими схемами.
"""


class InteractionUserResult:
    """
    Обёртка вокруг VkProfile + агрегированных данных из PostInteraction.
    
    Совместима с Pydantic-схемой SystemListInteraction (from_attributes=True).
    Все поля профиля проксируются из VkProfile, агрегированные поля вычислены из GROUP BY.
    """
    
    def __init__(self, vk_profile, interaction_count, last_interaction_date, project_id):
        self._vk_profile = vk_profile
        self._interaction_count = interaction_count
        self._last_interaction_date = last_interaction_date
        self._project_id = project_id
    
    # ── Служебные поля ─────────────────────────────────────────
    @property
    def id(self):
        """Синтетический ID для совместимости со схемой."""
        vid = self._vk_profile.vk_user_id if self._vk_profile else 0
        return f"{self._project_id}_{vid}"
    
    @property
    def project_id(self):
        return self._project_id
    
    # ── Агрегированные поля взаимодействий ─────────────────────
    @property
    def interaction_count(self):
        return self._interaction_count or 0
    
    @property
    def last_interaction_date(self):
        return self._last_interaction_date
    
    @property
    def post_ids(self):
        """Список post_ids. В агрегированном режиме недоступен напрямую — возвращаем пустой JSON."""
        return "[]"
    
    @property
    def last_post_id(self):
        return None
    
    # ── Совместимость с базовой схемой ListMemberBase ──────────
    @property
    def last_message_date(self):
        return None
    
    # ── Proxy-свойства профиля из VkProfile ────────────────────
    @property
    def vk_user_id(self):
        return self._vk_profile.vk_user_id if self._vk_profile else None
    
    @property
    def first_name(self):
        return self._vk_profile.first_name if self._vk_profile else None
    
    @property
    def last_name(self):
        return self._vk_profile.last_name if self._vk_profile else None
    
    @property
    def sex(self):
        return self._vk_profile.sex if self._vk_profile else None
    
    @property
    def photo_url(self):
        return self._vk_profile.photo_url if self._vk_profile else None
    
    @property
    def domain(self):
        return self._vk_profile.domain if self._vk_profile else None
    
    @property
    def bdate(self):
        return self._vk_profile.bdate if self._vk_profile else None
    
    @property
    def city(self):
        return self._vk_profile.city if self._vk_profile else None
    
    @property
    def country(self):
        return self._vk_profile.country if self._vk_profile else None
    
    @property
    def has_mobile(self):
        return self._vk_profile.has_mobile if self._vk_profile else None
    
    @property
    def is_closed(self):
        return self._vk_profile.is_closed if self._vk_profile else False
    
    @property
    def can_access_closed(self):
        return self._vk_profile.can_access_closed if self._vk_profile else None
    
    @property
    def deactivated(self):
        return self._vk_profile.deactivated if self._vk_profile else None
    
    @property
    def last_seen(self):
        return self._vk_profile.last_seen if self._vk_profile else None
    
    @property
    def platform(self):
        return self._vk_profile.platform if self._vk_profile else None
    
    @property
    def added_at(self):
        """Совместимость: added_at → last_interaction_date."""
        return self._last_interaction_date
