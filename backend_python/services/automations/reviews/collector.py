
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid
import json

import crud
import models
import services.automations.reviews.crud as crud_automations
from services import vk_service
# ВАЖНО: Импортируем низкоуровневый API клиент напрямую, минуя token_manager,
# чтобы использовать ИМЕННО наш админский токен без ротации
from services.vk_api.api_client import call_vk_api as raw_vk_call
from config import settings


def get_admin_token_for_group(db: Session, group_id: int) -> str:
    """
    Находит токен администратора для указанной группы.
    
    Логика:
    1. Ищем группу в administered_groups
    2. Смотрим admins_data — реальные админы группы (с их vk_user_id)
    3. Ищем токены этих админов в system_accounts по vk_user_id
    4. Возвращаем первый найденный активный токен
    5. Fallback на ENV токен (может не сработать если ENV не админ)
    """
    print(f"CONTEST: Looking for admin token for group {group_id}...")
    
    # 1. Ищем группу в базе администрируемых сообществ
    administered_group = db.query(models.AdministeredGroup).filter(
        models.AdministeredGroup.id == group_id
    ).first()
    
    if not administered_group:
        print(f"CONTEST: Group {group_id} not found in administered_groups, using ENV token")
        return settings.vk_user_token
    
    # 2. Парсим admins_data — реальные админы группы
    admins_data = []
    if administered_group.admins_data:
        try:
            admins_data = json.loads(administered_group.admins_data)
        except:
            admins_data = []
    
    # Собираем VK ID всех активных админов
    admin_vk_ids = set()
    for admin in admins_data:
        if isinstance(admin, dict) and admin.get('status') == 'active':
            admin_vk_ids.add(admin.get('id'))
    
    print(f"CONTEST: Group {group_id} has {len(admin_vk_ids)} active admins: {admin_vk_ids}")
    
    # 3. Получаем все активные системные аккаунты
    system_accounts = crud.get_all_accounts(db)
    
    # 4. Ищем токен среди аккаунтов, которые являются админами группы
    for acc in system_accounts:
        if acc.status != 'active' or not acc.token:
            continue
        
        # Сравниваем vk_user_id аккаунта с ID админов группы
        if acc.vk_user_id in admin_vk_ids:
            print(f"CONTEST: ✅ Found admin token from {acc.full_name} (VK ID: {acc.vk_user_id})")
            return acc.token
    
    # 5. Fallback: ищем по admin_sources (старый способ)
    admin_sources = []
    if administered_group.admin_sources:
        try:
            admin_sources = json.loads(administered_group.admin_sources)
        except:
            admin_sources = []
    
    print(f"CONTEST: No admin found by admins_data, checking admin_sources: {admin_sources}")
    
    for acc in system_accounts:
        if acc.status != 'active' or not acc.token:
            continue
        acc_name_pattern = f"{acc.full_name} (ID: {acc.vk_user_id})"
        if acc_name_pattern in admin_sources:
            print(f"CONTEST: Found token by admin_sources: {acc.full_name}")
            return acc.token
    
    # 6. Fallback на ENV токен (может не сработать!)
    print(f"CONTEST: ⚠️ No admin token found! Using ENV token as fallback (may not work)")
    return settings.vk_user_token


def collect_participants(db: Session, project_id: str) -> dict:
    """
    Сканирует SystemListPost, находит подходящие посты, 
    дозапрашивает данные об авторах из VK и сохраняет участников.
    """
    
    # 0. Проверка свежести базы постов (SystemListPost)
    # Если база старая (> 12 часов) или отсутствует, обновляем последние 100 постов,
    # чтобы гарантировать наличие свежих отзывов.
    meta = crud.get_list_meta(db, project_id)
    is_stale = True
    
    if meta.posts_last_updated:
        try:
            # Обработка формата ISO
            last_update_str = meta.posts_last_updated
            if 'T' in last_update_str:
                last_update = datetime.fromisoformat(last_update_str.replace('Z', '+00:00'))
            else:
                 # Fallback для старых форматов или если что-то пошло не так
                 try:
                     last_update = datetime.strptime(last_update_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                 except:
                     last_update = datetime.min.replace(tzinfo=timezone.utc)
            
            if datetime.now(timezone.utc) - last_update < timedelta(hours=12):
                is_stale = False
        except Exception as e:
             print(f"CONTEST: Date parse error in freshness check: {e}")
             is_stale = True
    
    if is_stale:
        print(f"CONTEST: Posts cache is stale or missing for project {project_id}. Triggering refresh (100 latest)...")
        # Импортируем здесь, чтобы избежать циклических зависимостей
        from services import post_retrieval_service
        try:
            post_retrieval_service.refresh_published_posts(db, project_id, settings.vk_user_token)
            print("CONTEST: Refresh completed successfully.")
        except Exception as e:
            print(f"CONTEST: Warning - Refresh failed: {e}. Proceeding with existing cache.")


    # 1. Получаем настройки конкурса
    contest = crud_automations.get_contest_settings(db, project_id)
    if not contest:
        return {"added": 0, "message": "Настройки конкурса не найдены"}
    
    if not contest.keywords or not contest.start_date:
        return {"added": 0, "message": "Не заданы ключевые слова или дата старта"}

    # ЗАЩИТА: Кешируем все нужные атрибуты contest СРАЗУ после загрузки.
    # VK API вызовы внутри могут спровоцировать commit/close в другой сессии,
    # что сделает ORM-объект contest detached → DetachedInstanceError.
    contest_id = contest.id

    # 2. Подготовка фильтров
    keyword = contest.keywords.strip().lower()
    print(f"CONTEST: Looking for keyword: '{keyword}'")
    
    # Обработка формата даты
    try:
        if 'T' in contest.start_date:
             start_dt = datetime.fromisoformat(contest.start_date.replace('Z', '+00:00'))
        else:
             # Fallback для YYYY-MM-DD
             start_dt = datetime.strptime(contest.start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return {"added": 0, "message": "Некорректный формат даты старта в настройках"}
    
    print(f"CONTEST: Start date filter: {start_dt}")
    
    # 3. Ищем кандидатов в локальной базе постов (SystemListPost)
    print(f"CONTEST: Searching candidates in SystemListPost for project {project_id}...")
    
    # Отладочный вывод: показываем все посты в базе для этого проекта
    all_posts = db.query(models.SystemListPost).filter(
        models.SystemListPost.project_id == project_id
    ).all()
    print(f"CONTEST: Total posts in DB for project: {len(all_posts)}")
    for p in all_posts[:5]:  # Первые 5 для отладки
        print(f"  - Post ID {p.vk_post_id}: date={p.date}, text='{p.text[:80] if p.text else 'None'}...'")
    
    candidates = db.query(models.SystemListPost).filter(
        models.SystemListPost.project_id == project_id,
        models.SystemListPost.date >= start_dt,
        models.SystemListPost.text.ilike(f"%{keyword}%")
    ).all()
    
    print(f"CONTEST: Found {len(candidates)} candidates matching keyword")
    for c in candidates:
        print(f"  - Candidate ID {c.vk_post_id}: '{c.text[:80] if c.text else 'None'}...'")
    
    if not candidates:
        return {"added": 0, "message": "Посты по критериям не найдены в базе"}

    # 4. Фильтруем тех, кто уже участвует
    existing_entries = db.query(models.ReviewContestEntry.vk_post_id).filter(
        models.ReviewContestEntry.contest_id == contest_id
    ).all()
    existing_vk_ids = {e[0] for e in existing_entries}
    
    new_candidates = [p for p in candidates if p.vk_post_id not in existing_vk_ids]
    
    if not new_candidates:
        return {"added": 0, "message": "Все подходящие посты уже добавлены"}

    print(f"CONTEST: Found {len(new_candidates)} new candidates. Fetching authors from VK...")

    # 5. Получаем данные об авторах из VK
    numeric_group_id = vk_service.resolve_vk_group_id(crud.get_project_by_id(db, project_id).vkProjectId, settings.vk_user_token)
    
    # ВАЖНО: Получаем токен администратора группы для запросов
    # post_author_data доступно только администраторам сообщества!
    admin_token = get_admin_token_for_group(db, numeric_group_id)
    
    # --- ЛОГИКА ОПРЕДЕЛЕНИЯ АВТОРА ---
    # Используем ТОЛЬКО post_author_data.author как единственный источник правды.
    # signer_id (подпись) НЕ используется — это только визуальная подпись, не автор.
    
    candidates_with_known_author = []
    candidates_need_fetch = []
    
    for p in new_candidates:
        # ТОЛЬКО post_author_id (из post_author_data.author)
        author_id = p.post_author_id
        print(f"CONTEST: Post {p.vk_post_id}: post_author_id={p.post_author_id} (signer_id игнорируется)")
        
        if author_id and author_id > 0:
            candidates_with_known_author.append((p, author_id))
        else:
            candidates_need_fetch.append(p)
    
    prepared_data = {} # {vk_post_id: {author_id, ...}}
    user_ids_to_fetch = set()

    # 5.1. Обработка тех, у кого автор известен из базы
    print(f"CONTEST: candidates_with_known_author={len(candidates_with_known_author)}, candidates_need_fetch={len(candidates_need_fetch)}")
    
    for p, author_id in candidates_with_known_author:
        user_ids_to_fetch.add(author_id)
        prepared_data[p.vk_post_id] = {
            'author_id': author_id,
            'post_id': p.vk_post_id,
            'owner_id': -numeric_group_id,
            'text': p.text
        }

    # 5.2. Обработка тех, у кого автор неизвестен (запрос к wall.get)
    # ВАЖНО: wall.getById НЕ возвращает post_author_data даже с extended=1
    # Поэтому используем wall.get и фильтруем нужные посты
    if candidates_need_fetch:
        import json
        
        # Диагностика токена
        print(f"CONTEST: Using admin_token (first 20 chars): {admin_token[:20] if admin_token else 'None'}...")
        print(f"CONTEST: ENV token (first 20 chars): {settings.vk_user_token[:20] if settings.vk_user_token else 'None'}...")
        
        needed_post_ids = {p.vk_post_id for p in candidates_need_fetch}
        print(f"CONTEST: Need to fetch author data for posts: {needed_post_ids}")
        
        # Используем wall.get вместо wall.getById, т.к. wall.get возвращает post_author_data
        # КРИТИЧНО: Используем raw_vk_call напрямую, минуя token_manager,
        # чтобы гарантировать использование ИМЕННО нашего админского токена
        # (token_manager заменяет токен на системные аккаунты, которые могут не быть админами!)
        all_vk_posts = []
        try:
            # Запрашиваем последние 100 постов (должно покрыть наши нужные)
            response = raw_vk_call('wall.get', {
                'owner_id': -numeric_group_id,
                'count': 100,
                'extended': 1,
                'access_token': admin_token
            })
            
            # ПОЛНОЕ ЛОГИРОВАНИЕ JSON ОТВЕТА VK
            print("=" * 80)
            print("VK API FULL RESPONSE (wall.get):")
            print("=" * 80)
            print(json.dumps(response, indent=2, ensure_ascii=False)[:3000])  # Первые 3000 символов
            print("... (truncated)")
            print("=" * 80)
            
            items = response.get('items', [])
            print(f"CONTEST: wall.get returned {len(items)} posts")
            
            # Фильтруем только нужные посты
            for post in items:
                if post.get('id') in needed_post_ids:
                    all_vk_posts.append(post)
                    print(f"CONTEST: Found needed post {post.get('id')}, post_author_data={post.get('post_author_data')}")
                    
        except Exception as e:
            print(f"CONTEST: Error fetching posts from VK: {e}")
        
        print(f"CONTEST: Got {len(all_vk_posts)} needed posts from VK API")
        
        for vk_post in all_vk_posts:
            # ТОЛЬКО post_author_data.author — единственный источник правды
            author_id = None
            post_author_data = vk_post.get('post_author_data')
            
            print(f"CONTEST: VK Post {vk_post.get('id')}: post_author_data={post_author_data}")
            
            if post_author_data and 'author' in post_author_data:
                author_id = post_author_data['author']
            
            print(f"CONTEST: Resolved author_id={author_id}, is_valid={author_id and author_id > 0}")

            if author_id and author_id > 0:
                user_ids_to_fetch.add(author_id)
                prepared_data[vk_post['id']] = {
                    'author_id': author_id,
                    'post_id': vk_post['id'],
                    'owner_id': vk_post['owner_id'],
                    'text': vk_post.get('text', '')
                }

    # 6. Получаем имена пользователей
    print(f"CONTEST: prepared_data has {len(prepared_data)} entries, user_ids_to_fetch={user_ids_to_fetch}")
    
    users_map = {}
    if user_ids_to_fetch:
        user_ids_list = list(user_ids_to_fetch)
        chunk_size_users = 1000
        for i in range(0, len(user_ids_list), chunk_size_users):
            chunk_users = user_ids_list[i:i + chunk_size_users]
            try:
                # Используем raw_vk_call для консистентности
                users_resp = raw_vk_call('users.get', {
                    'user_ids': ",".join(map(str, chunk_users)),
                    'fields': 'photo_100',
                    'access_token': admin_token  # Используем токен админа группы!
                })
                for u in users_resp:
                    users_map[u['id']] = u
            except Exception as e:
                print(f"CONTEST: Error fetching users: {e}")

    # 7. Создаем записи
    print(f"CONTEST: users_map has {len(users_map)} users: {list(users_map.keys())}")
    
    # Собираем даты постов для каждого vk_post_id (из SystemListPost.date)
    post_dates_map = {}
    for p in new_candidates:
        post_dates_map[p.vk_post_id] = p.date

    added_count = 0
    
    for vk_post_id, data in prepared_data.items():
        user = users_map.get(data['author_id'])
        print(f"CONTEST: Creating entry for post {vk_post_id}, author_id={data['author_id']}, user found={user is not None}")
        if not user: continue
        
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}"
        
        new_entry = models.ReviewContestEntry(
            id=str(uuid.uuid4()),
            contest_id=contest_id,
            vk_post_id=data['post_id'],
            vk_owner_id=data['owner_id'],
            user_vk_id=data['author_id'],
            user_name=user_name,
            user_photo=user.get('photo_100'),
            post_link=f"https://vk.com/wall{data['owner_id']}_{data['post_id']}",
            post_text=data['text'],
            post_date=post_dates_map.get(vk_post_id),  # Реальная дата поста из VK
            status='new',
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_entry)
        added_count += 1
        
    db.commit()
    
    # 8. Обновляем метаданные списков (счетчики)
    if added_count > 0:
        # Участники (не new)
        participants_count = db.query(models.ReviewContestEntry).filter(
            models.ReviewContestEntry.contest_id == contest_id,
            models.ReviewContestEntry.status != 'new'
        ).count()
        # Посты (всего)
        posts_count = db.query(models.ReviewContestEntry).filter(
            models.ReviewContestEntry.contest_id == contest_id
        ).count()
        
        crud.update_list_meta(db, project_id, {
            "reviews_participants_count": participants_count,
            "reviews_posts_count": posts_count
        })

    return {
        "added": added_count, 
        "message": f"Добавлено {added_count} новых участников"
    }
