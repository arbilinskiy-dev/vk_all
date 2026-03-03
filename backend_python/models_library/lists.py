
from sqlalchemy import Column, String, Integer, Boolean, BigInteger, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

class ProjectListMeta(Base):
    __tablename__ = "project_list_meta"
    id = Column(String, primary_key=True) # project_id
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    
    subscribers_last_updated = Column(String, nullable=True)
    subscribers_count = Column(Integer, default=0)
    
    history_join_last_updated = Column(String, nullable=True)
    history_join_count = Column(Integer, default=0)
    
    history_leave_last_updated = Column(String, nullable=True)
    history_leave_count = Column(Integer, default=0)
    
    # Новый счетчик для рассылки
    mailing_last_updated = Column(String, nullable=True)
    mailing_count = Column(Integer, default=0)

    posts_last_updated = Column(String, nullable=True)
    posts_count = Column(Integer, default=0) # Количество в VK
    stored_posts_count = Column(Integer, default=0) # Количество, сохраненное в нашей БД
    
    # Взаимодействия (счетчики и время)
    likes_count = Column(Integer, default=0)
    likes_last_updated = Column(String, nullable=True)
    
    comments_count = Column(Integer, default=0)
    comments_last_updated = Column(String, nullable=True)
    
    reposts_count = Column(Integer, default=0)
    reposts_last_updated = Column(String, nullable=True)

    # Автоматизации: Конкурс отзывов
    reviews_participants_count = Column(Integer, default=0)
    reviews_winners_count = Column(Integer, default=0)
    reviews_posts_count = Column(Integer, default=0)

    # NEW: Авторы постов
    authors_count = Column(Integer, default=0)
    authors_last_updated = Column(String, nullable=True)


class SystemListPost(Base):
    __tablename__ = "system_list_posts"
    id = Column(String, primary_key=True) 
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    vk_post_id = Column(BigInteger, index=True)
    
    date = Column(DateTime(timezone=True))
    text = Column(Text, nullable=True)
    image_url = Column(String, nullable=True) 
    vk_link = Column(String)
    
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    reposts_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    can_post_comment = Column(Boolean, default=True)
    can_like = Column(Boolean, default=True)
    user_likes = Column(Boolean, default=False)
    
    # ID автора поста (если есть подпись)
    signer_id = Column(BigInteger, nullable=True)
    # NEW: ID автора поста из объекта post_author_data (приоритетный)
    post_author_id = Column(BigInteger, nullable=True)
    
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
