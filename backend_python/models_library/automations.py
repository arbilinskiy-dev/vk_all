
from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, DateTime, BigInteger, UniqueConstraint
from sqlalchemy.sql import func
from database import Base

class ReviewContest(Base):
    __tablename__ = "review_contests"
    
    id = Column(String, primary_key=True, index=True) # UUID
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, unique=True)
    
    # Основные настройки
    is_active = Column(Boolean, default=False)
    keywords = Column(String, nullable=True)
    start_date = Column(String, nullable=True) # ISO Date string
    
    # Условия завершения
    finish_condition = Column(String, default='date') # count, date, mixed
    target_count = Column(Integer, nullable=True)
    target_count_mode = Column(String, default='exact') # exact | minimum | maximum
    finish_date = Column(String, nullable=True) # Legacy/Direct date
    finish_day_of_week = Column(Integer, nullable=True) # 1-7
    finish_time = Column(String, nullable=True) # HH:MM
    
    # Настройки авто-бана
    auto_blacklist = Column(Boolean, default=False)
    auto_blacklist_duration = Column(Integer, default=7)
    
    # Шаблоны
    template_comment = Column(Text, nullable=True)
    template_winner_post = Column(Text, nullable=True)
    winner_post_images = Column(Text, nullable=True) # JSON list of photos
    template_dm = Column(Text, nullable=True)
    template_error_comment = Column(Text, nullable=True)
    
    # Изображение-доказательство розыгрыша (генерируется автоматически)
    use_proof_image = Column(Boolean, default=True)
    attach_additional_media = Column(Boolean, default=False)  # Прикреплять дополнительные медиа
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ReviewContestEntry(Base):
    __tablename__ = "review_contest_entries"
    
    id = Column(String, primary_key=True, index=True) # UUID
    contest_id = Column(String, ForeignKey("review_contests.id", ondelete="CASCADE"), index=True)
    
    vk_post_id = Column(Integer, nullable=False)
    vk_owner_id = Column(Integer, nullable=False)
    
    user_vk_id = Column(BigInteger, nullable=False)
    user_name = Column(String, nullable=True)
    user_photo = Column(String, nullable=True)
    
    # Дополнительные поля для отображения
    post_link = Column(String, nullable=True)  # Ссылка на пост VK
    post_text = Column(Text, nullable=True)    # Текст поста
    post_date = Column(DateTime(timezone=True), nullable=True)  # Реальная дата публикации поста в VK
    status = Column(String, default='new')     # Статус: new, commented, error, winner, used
    entry_number = Column(Integer, nullable=True)  # Номер участника
    log = Column(Text, nullable=True)  # Диагностический лог (ошибки, результаты)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StoriesAutomation(Base):
    __tablename__ = "stories_automations"
    
    id = Column(String, primary_key=True, index=True) # UUID
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, unique=True)
    
    is_active = Column(Boolean, default=False)
    keywords = Column(String, nullable=True) # Comma separated or single keyword
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class StoriesAutomationLog(Base):
    __tablename__ = "stories_automation_logs"
    # Уникальный constraint для предотвращения дублирования историй от параллельных воркеров
    __table_args__ = (
        UniqueConstraint('project_id', 'vk_post_id', name='uq_stories_log_project_post'),
    )
    
    id = Column(String, primary_key=True, index=True) # UUID
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    vk_post_id = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    post_link = Column(String, nullable=True)
    post_text = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    
    status = Column(String, default='new') # new, processing, commented, error, winner
    entry_number = Column(Integer, nullable=True)
    log = Column(Text, nullable=True)
    
    # Statistics
    stats = Column(Text, nullable=True) # JSON stored as text
    stats_updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Viewers data (JSON array of viewers)
    viewers = Column(Text, nullable=True) # JSON stored as text
    viewers_updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Статус активности истории (активная/архивная)
    is_active = Column(Boolean, default=False, nullable=False)
    
    # Флаг финализации: история архивная и данные больше не меняются
    # Устанавливается автоматически, когда архивная история возвращает те же данные что в БД
    stats_finalized = Column(Boolean, default=False, nullable=False)
    
    # Флаг финализации зрителей: после финализации статистики собираем viewers последний раз
    # и больше не запрашиваем их для этой истории
    viewers_finalized = Column(Boolean, default=False, nullable=False)

class PromoCode(Base):
    __tablename__ = "promo_codes"
    
    id = Column(String, primary_key=True, index=True) # UUID
    contest_id = Column(String, ForeignKey("review_contests.id", ondelete="CASCADE"), index=True, nullable=True)
    general_contest_id = Column(String, ForeignKey("general_contests.id", ondelete="CASCADE"), index=True, nullable=True)
    
    code = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    is_issued = Column(Boolean, default=False)
    issued_at = Column(DateTime(timezone=True), nullable=True)
    
    # Денормализованные данные о том, кому выдано (чтобы быстро показывать в таблице)
    issued_to_user_id = Column(BigInteger, nullable=True)
    issued_to_user_name = Column(String, nullable=True)
    
    # Статус доставки сообщения (оставляем для совместимости, но основной источник теперь DeliveryLog)
    delivery_status = Column(String, nullable=True) 
    delivery_message = Column(Text, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReviewContestDeliveryLog(Base):
    __tablename__ = "review_contest_delivery_logs"
    
    id = Column(String, primary_key=True, index=True) # UUID
    contest_id = Column(String, ForeignKey("review_contests.id", ondelete="CASCADE"), index=True, nullable=True)
    general_contest_id = Column(String, ForeignKey("general_contests.id", ondelete="CASCADE"), index=True, nullable=True)
    
    # Кому отправляем
    user_vk_id = Column(BigInteger, nullable=False)
    user_name = Column(String, nullable=True)
    
    # Что отправляем (Snapshots)
    promo_code = Column(String, nullable=True) 
    prize_description = Column(String, nullable=True)
    message_text = Column(Text, nullable=False) # Сформированное сообщение
    
    # Ссылки на контекст (НОВОЕ)
    winner_post_link = Column(String, nullable=True) # Ссылка на пост победителя (отзыв)
    results_post_link = Column(String, nullable=True) # Ссылка на пост с итогами конкурса
    
    # Статус
    status = Column(String, default='pending') # sent, error
    error_details = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReviewContestBlacklist(Base):
    __tablename__ = "review_contest_blacklist"
    
    id = Column(String, primary_key=True, index=True) # UUID
    contest_id = Column(String, ForeignKey("review_contests.id", ondelete="CASCADE"), index=True, nullable=True)
    general_contest_id = Column(String, ForeignKey("general_contests.id", ondelete="CASCADE"), index=True, nullable=True)
    
    user_vk_id = Column(BigInteger, nullable=False)
    user_name = Column(String, nullable=True) # Имя для удобства отображения
    user_screen_name = Column(String, nullable=True) # screen_name или id123
    
    until_date = Column(DateTime(timezone=True), nullable=True) # Дата окончания бана. Если Null - навсегда.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
