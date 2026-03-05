"""
Модели для статистики нагрузки модуля сообщений.
Независимая от callback-логов аналитика — данные сохраняются навсегда.

Четыре основных таблицы:
1. MessageStatsHourly — агрегированные часовые слоты для графиков пиковых нагрузок
2. MessageStatsUser — детализация по пользователям (кто сколько писал)
3. MessageStatsAdmin — статистика по администраторам (кто из менеджеров сколько отправил)
4. MessageSubscription — история подписок/отписок (message_allow / message_deny)
"""

from sqlalchemy import Column, String, Integer, Float, SmallInteger, Index
from database import Base


class MessageStatsHourly(Base):
    """
    Агрегированная часовая статистика сообщений.
    Одна строка = один проект × один час.
    Используется для графиков пиковых нагрузок.
    
    PK: "{project_id}_{YYYY-MM-DDTHH}" → "123_2026-02-24T14"
    """
    __tablename__ = "message_stats_hourly"

    # Синтетический PK: "{project_id}_{hour_slot}"
    id = Column(String, primary_key=True, index=True)
    
    # ID проекта
    project_id = Column(String, nullable=False, index=True)
    
    # Часовой слот в формате "YYYY-MM-DDTHH" (например "2026-02-24T14")
    hour_slot = Column(String, nullable=False, index=True)
    
    # --- Общие счётчики ---
    # Количество входящих сообщений за этот час
    incoming_count = Column(Integer, nullable=False, default=0)
    
    # Количество исходящих сообщений за этот час
    outgoing_count = Column(Integer, nullable=False, default=0)
    
    # --- Входящие: детализация ---
    # Входящие с payload (нажатия кнопок/ботов)
    incoming_payload_count = Column(Integer, nullable=False, default=0)
    
    # Входящие «живые» текстовые (набраны руками)
    incoming_text_count = Column(Integer, nullable=False, default=0)
    
    # --- Исходящие: детализация ---
    # Исходящие через нашу систему (sender_id известен — менеджер отправил)
    outgoing_system_count = Column(Integer, nullable=False, default=0)
    
    # Исходящие от бота/рассылки (callback message_reply без sender_id)
    outgoing_bot_count = Column(Integer, nullable=False, default=0)
    
    # --- Уникальные пользователи/диалоги ---
    # Количество уникальных пользователей за этот час
    unique_users_count = Column(Integer, nullable=False, default=0)
    
    # JSON-массив уникальных vk_user_id за этот час (для подсчёта без дублей)
    unique_users_json = Column(String, nullable=True, default="[]")
    
    # JSON-массив уникальных vk_user_id, написавших «живые» сообщения
    unique_text_users_json = Column(String, nullable=True, default="[]")
    
    # JSON-массив уникальных vk_user_id, нажавших кнопку/бота (с payload)
    unique_payload_users_json = Column(String, nullable=True, default="[]")
    
    # JSON-массив уникальных vk_user_id — получателей исходящих сообщений за этот час
    outgoing_users_json = Column(String, nullable=True, default="[]")
    
    # --- Счётчики уникальных пользователей (замена JSON-массивов) ---
    # Кол-во уникальных текстовых юзеров (набрали сообщение руками)
    unique_text_users_count = Column(Integer, nullable=False, default=0)
    
    # Кол-во уникальных payload-юзеров (нажали кнопку/бота)
    unique_payload_users_count = Column(Integer, nullable=False, default=0)
    
    # Кол-во уникальных получателей исходящих сообщений
    outgoing_users_count = Column(Integer, nullable=False, default=0)
    
    # Кол-во уникальных входящих юзеров (text ∪ payload)
    incoming_users_count = Column(Integer, nullable=False, default=0)
    
    # Кол-во уникальных диалогов (project_id×vk_user_id пар) за этот час
    # В рамках одного проекта = unique_users_count, но используется для кросс-проектного подсчёта
    unique_dialogs_count = Column(Integer, nullable=False, default=0)
    
    # Временные метки
    created_at = Column(Float, nullable=False)
    updated_at = Column(Float, nullable=False)

    __table_args__ = (
        Index("ix_msg_stats_hourly_project_hour", "project_id", "hour_slot"),
    )


class MessageStatsHourlyUsers(Base):
    """
    Нормализованная таблица: какие пользователи были активны в каком часовом слоте.
    Заменяет JSON-массивы в MessageStatsHourly.
    
    user_type: 1=text (набрал сообщение), 2=payload (кнопка/бот), 3=outgoing (получатель)
    
    INSERT-only + ON CONFLICT DO NOTHING → нет UPDATE, нет TOAST-блоата.
    """
    __tablename__ = "message_stats_hourly_users"
    
    # Составной PK: (project_id, hour_slot, vk_user_id, user_type)
    project_id = Column(String, primary_key=True)
    hour_slot = Column(String, primary_key=True)
    vk_user_id = Column(Integer, primary_key=True)
    user_type = Column(SmallInteger, primary_key=True)
    
    __table_args__ = (
        Index("ix_mshu_project_slot", "project_id", "hour_slot"),
        Index("ix_mshu_project_user", "project_id", "vk_user_id"),
    )


class MessageStatsUser(Base):
    """
    Детализация статистики по пользователям.
    Одна строка = один пользователь в одном проекте (за всё время).
    Позволяет видеть кто именно писал и сколько сообщений отправил.
    
    PK: "{project_id}_{vk_user_id}" → "123_456789"
    """
    __tablename__ = "message_stats_user"

    # Синтетический PK: "{project_id}_{vk_user_id}"
    id = Column(String, primary_key=True, index=True)
    
    # ID проекта
    project_id = Column(String, nullable=False, index=True)
    
    # VK user_id пользователя
    vk_user_id = Column(Integer, nullable=False, index=True)
    
    # Количество входящих сообщений от этого пользователя
    incoming_count = Column(Integer, nullable=False, default=0)
    
    # Количество исходящих сообщений этому пользователю
    outgoing_count = Column(Integer, nullable=False, default=0)
    
    # Unix timestamp первого сообщения
    first_message_at = Column(Float, nullable=True)
    
    # Unix timestamp последнего сообщения
    last_message_at = Column(Float, nullable=True)

    __table_args__ = (
        Index("ix_msg_stats_user_project_user", "project_id", "vk_user_id"),
        # Индекс для сортировки по активности
        Index("ix_msg_stats_user_last_msg", "project_id", "last_message_at"),
    )


class MessageStatsAdmin(Base):
    """
    Статистика по администраторам/менеджерам.
    Одна строка = один менеджер × один проект × один день.
    
    Позволяет видеть: «Вася отправил 500 сообщений в 35 диалогов за сегодня».
    
    PK: "{sender_id}_{project_id}_{YYYY-MM-DD}" → "user123_proj456_2026-02-25"
    """
    __tablename__ = "message_stats_admin"

    # Синтетический PK
    id = Column(String, primary_key=True, index=True)
    
    # ID менеджера (из auth-системы)
    sender_id = Column(String, nullable=False, index=True)
    
    # Имя менеджера (кэш для отображения)
    sender_name = Column(String, nullable=True)
    
    # ID проекта
    project_id = Column(String, nullable=False, index=True)
    
    # Дата в формате "YYYY-MM-DD"
    date = Column(String, nullable=False, index=True)
    
    # Количество отправленных сообщений за этот день
    messages_sent = Column(Integer, nullable=False, default=0)
    
    # Количество уникальных диалогов за этот день
    unique_dialogs = Column(Integer, nullable=False, default=0)
    
    # JSON-массив vk_user_id уникальных диалогов (для подсчёта без дублей)
    unique_dialogs_json = Column(String, nullable=True, default="[]")
    
    # Временные метки
    created_at = Column(Float, nullable=False)
    updated_at = Column(Float, nullable=False)

    __table_args__ = (
        Index("ix_msg_stats_admin_sender_date", "sender_id", "date"),
        Index("ix_msg_stats_admin_project_date", "project_id", "date"),
    )


class MessageSubscription(Base):
    """
    История подписок/отписок на сообщения сообщества.
    Фиксирует каждое событие message_allow / message_deny из VK Callback API.
    
    Append-only таблица — только вставки, без обновлений.
    Одна строка = одно событие (пользователь разрешил/запретил сообщения).
    
    PK: автоинкрементный Integer (простой append-only лог).
    """
    __tablename__ = "message_subscriptions"

    # Автоинкрементный PK
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # ID проекта (сообщества)
    project_id = Column(String, nullable=False, index=True)
    
    # VK user_id пользователя
    vk_user_id = Column(Integer, nullable=False, index=True)
    
    # Тип события: "allow" или "deny"
    event_type = Column(String, nullable=False, index=True)
    
    # Unix timestamp события (из VK callback или момент обработки)
    event_at = Column(Float, nullable=False, index=True)
    
    # Дата события в формате "YYYY-MM-DD" (для быстрой фильтрации по периоду)
    event_date = Column(String, nullable=False, index=True)
    
    # Часовой слот "YYYY-MM-DDTHH" (для графика)
    hour_slot = Column(String, nullable=False, index=True)

    __table_args__ = (
        Index("ix_msg_sub_project_date", "project_id", "event_date"),
        Index("ix_msg_sub_project_type", "project_id", "event_type"),
        Index("ix_msg_sub_date_type", "event_date", "event_type"),
    )
