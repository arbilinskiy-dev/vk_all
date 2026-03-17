"""
Миграция для таблиц DLVRY-заказов.
Создаёт таблицы dlvry_orders, dlvry_order_items, dlvry_webhook_logs.
"""

from sqlalchemy import Engine, inspect, text


def migrate(engine: Engine):
    """Создание и обновление таблиц для DLVRY-интеграции."""
    inspector = inspect(engine)
    is_postgres = 'postgresql' in str(engine.url)

    # ── Таблица dlvry_orders ──────────────────────────────────
    if not inspector.has_table('dlvry_orders'):
        print("[DLVRY] Создаём таблицу dlvry_orders...")
        with engine.begin() as conn:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE dlvry_orders (
                        id SERIAL PRIMARY KEY,
                        dlvry_order_id VARCHAR NOT NULL,
                        owner_id VARCHAR,
                        affiliate_id VARCHAR NOT NULL,
                        project_id VARCHAR,
                        vk_group_id VARCHAR,
                        vk_user_id VARCHAR,
                        vk_platform VARCHAR,
                        domain VARCHAR,
                        source_code VARCHAR,
                        source_name VARCHAR,
                        client_id VARCHAR,
                        client_name VARCHAR,
                        phone_raw VARCHAR,
                        phone VARCHAR,
                        client_email VARCHAR,
                        client_bday VARCHAR,
                        payment_code VARCHAR,
                        payment_name VARCHAR,
                        delivery_code VARCHAR,
                        delivery_name VARCHAR,
                        delivery_price FLOAT DEFAULT 0,
                        pickup_point_code VARCHAR,
                        pickup_point_name VARCHAR,
                        address_country VARCHAR,
                        address_region VARCHAR,
                        address_city VARCHAR,
                        address_district VARCHAR,
                        address_street VARCHAR,
                        address_house VARCHAR,
                        address_block VARCHAR,
                        address_entrance VARCHAR,
                        address_floor VARCHAR,
                        address_apt VARCHAR,
                        address_full TEXT,
                        items_text TEXT,
                        items_count INTEGER DEFAULT 0,
                        items_total_qty INTEGER DEFAULT 0,
                        order_sum FLOAT DEFAULT 0,
                        discount FLOAT DEFAULT 0,
                        payment_bonus FLOAT DEFAULT 0,
                        markup FLOAT DEFAULT 0,
                        total FLOAT DEFAULT 0,
                        cost FLOAT DEFAULT 0,
                        persons INTEGER DEFAULT 0,
                        promocode VARCHAR,
                        comment TEXT,
                        is_preorder BOOLEAN NOT NULL DEFAULT FALSE,
                        order_date_str VARCHAR,
                        order_date TIMESTAMP WITH TIME ZONE,
                        order_year INTEGER,
                        order_month INTEGER,
                        order_weekday INTEGER,
                        raw_json TEXT,
                        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        status VARCHAR NOT NULL DEFAULT 'received'
                    )
                """))
                # Индексы
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_dlvry_order_id ON dlvry_orders (dlvry_order_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_affiliate_id ON dlvry_orders (affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_group_id ON dlvry_orders (vk_group_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_user_id ON dlvry_orders (vk_user_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_phone ON dlvry_orders (phone)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_address_city ON dlvry_orders (address_city)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_order_date ON dlvry_orders (order_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_received_at ON dlvry_orders (received_at)'))
                conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_dlvry_orders_unique ON dlvry_orders (dlvry_order_id, affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_affiliate_date ON dlvry_orders (affiliate_id, order_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_group_date ON dlvry_orders (vk_group_id, order_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_project_date ON dlvry_orders (project_id, order_date)'))
            else:
                conn.execute(text("""
                    CREATE TABLE dlvry_orders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        dlvry_order_id VARCHAR NOT NULL,
                        owner_id VARCHAR,
                        affiliate_id VARCHAR NOT NULL,
                        project_id VARCHAR,
                        vk_group_id VARCHAR,
                        vk_user_id VARCHAR,
                        vk_platform VARCHAR,
                        domain VARCHAR,
                        source_code VARCHAR,
                        source_name VARCHAR,
                        client_id VARCHAR,
                        client_name VARCHAR,
                        phone_raw VARCHAR,
                        phone VARCHAR,
                        client_email VARCHAR,
                        client_bday VARCHAR,
                        payment_code VARCHAR,
                        payment_name VARCHAR,
                        delivery_code VARCHAR,
                        delivery_name VARCHAR,
                        delivery_price FLOAT DEFAULT 0,
                        pickup_point_code VARCHAR,
                        pickup_point_name VARCHAR,
                        address_country VARCHAR,
                        address_region VARCHAR,
                        address_city VARCHAR,
                        address_district VARCHAR,
                        address_street VARCHAR,
                        address_house VARCHAR,
                        address_block VARCHAR,
                        address_entrance VARCHAR,
                        address_floor VARCHAR,
                        address_apt VARCHAR,
                        address_full TEXT,
                        items_text TEXT,
                        items_count INTEGER DEFAULT 0,
                        items_total_qty INTEGER DEFAULT 0,
                        order_sum FLOAT DEFAULT 0,
                        discount FLOAT DEFAULT 0,
                        payment_bonus FLOAT DEFAULT 0,
                        markup FLOAT DEFAULT 0,
                        total FLOAT DEFAULT 0,
                        cost FLOAT DEFAULT 0,
                        persons INTEGER DEFAULT 0,
                        promocode VARCHAR,
                        comment TEXT,
                        is_preorder BOOLEAN NOT NULL DEFAULT 0,
                        order_date_str VARCHAR,
                        order_date DATETIME,
                        order_year INTEGER,
                        order_month INTEGER,
                        order_weekday INTEGER,
                        raw_json TEXT,
                        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        status VARCHAR NOT NULL DEFAULT 'received'
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_dlvry_order_id ON dlvry_orders (dlvry_order_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_affiliate_id ON dlvry_orders (affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_group_id ON dlvry_orders (vk_group_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_user_id ON dlvry_orders (vk_user_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_phone ON dlvry_orders (phone)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_address_city ON dlvry_orders (address_city)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_order_date ON dlvry_orders (order_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_received_at ON dlvry_orders (received_at)'))
                conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_dlvry_orders_unique ON dlvry_orders (dlvry_order_id, affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_affiliate_date ON dlvry_orders (affiliate_id, order_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_group_date ON dlvry_orders (vk_group_id, order_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_project_date ON dlvry_orders (project_id, order_date)'))
        print("[DLVRY] ✓ Таблица dlvry_orders создана")
    else:
        print("[DLVRY] Таблица dlvry_orders уже существует")
    
    # Миграция: добавление project_id в существующую таблицу
    _add_project_id_column(engine, inspector)

    # Миграция: добавление vk_profile_id (FK на vk_profiles) + backfill
    _add_vk_profile_id_column(engine, inspector)

    # ── Таблица dlvry_order_items ─────────────────────────────
    if not inspector.has_table('dlvry_order_items'):
        print("[DLVRY] Создаём таблицу dlvry_order_items...")
        with engine.begin() as conn:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE dlvry_order_items (
                        id SERIAL PRIMARY KEY,
                        order_id INTEGER NOT NULL,
                        dlvry_item_id VARCHAR,
                        code VARCHAR,
                        name VARCHAR NOT NULL,
                        price FLOAT DEFAULT 0,
                        quantity INTEGER NOT NULL DEFAULT 1,
                        full_price FLOAT DEFAULT 0,
                        cost_price FLOAT DEFAULT 0,
                        weight VARCHAR,
                        volume VARCHAR,
                        options_json TEXT,
                        sku_title VARCHAR,
                        image_url VARCHAR
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_order_items_order ON dlvry_order_items (order_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_order_items_code ON dlvry_order_items (code)'))
            else:
                conn.execute(text("""
                    CREATE TABLE dlvry_order_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        order_id INTEGER NOT NULL,
                        dlvry_item_id VARCHAR,
                        code VARCHAR,
                        name VARCHAR NOT NULL,
                        price FLOAT DEFAULT 0,
                        quantity INTEGER NOT NULL DEFAULT 1,
                        full_price FLOAT DEFAULT 0,
                        cost_price FLOAT DEFAULT 0,
                        weight VARCHAR,
                        volume VARCHAR,
                        options_json TEXT,
                        sku_title VARCHAR,
                        image_url VARCHAR
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_order_items_order ON dlvry_order_items (order_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_order_items_code ON dlvry_order_items (code)'))
        print("[DLVRY] ✓ Таблица dlvry_order_items создана")
    else:
        print("[DLVRY] Таблица dlvry_order_items уже существует")

    # ── Таблица dlvry_webhook_logs ────────────────────────────
    if not inspector.has_table('dlvry_webhook_logs'):
        print("[DLVRY] Создаём таблицу dlvry_webhook_logs...")
        with engine.begin() as conn:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE dlvry_webhook_logs (
                        id SERIAL PRIMARY KEY,
                        remote_ip VARCHAR,
                        affiliate_id VARCHAR,
                        dlvry_order_id VARCHAR,
                        result VARCHAR NOT NULL DEFAULT 'ok',
                        error_message TEXT,
                        payload TEXT,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_webhook_logs_affiliate_id ON dlvry_webhook_logs (affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_webhook_logs_timestamp ON dlvry_webhook_logs (timestamp)'))
            else:
                conn.execute(text("""
                    CREATE TABLE dlvry_webhook_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        remote_ip VARCHAR,
                        affiliate_id VARCHAR,
                        dlvry_order_id VARCHAR,
                        result VARCHAR NOT NULL DEFAULT 'ok',
                        error_message TEXT,
                        payload TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_webhook_logs_affiliate_id ON dlvry_webhook_logs (affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_webhook_logs_timestamp ON dlvry_webhook_logs (timestamp)'))
        print("[DLVRY] ✓ Таблица dlvry_webhook_logs создана")
    else:
        print("[DLVRY] Таблица dlvry_webhook_logs уже существует")

    print("[DLVRY] Миграция завершена.")


def _add_project_id_column(engine: Engine, inspector):
    """Добавляет колонку project_id в dlvry_orders (привязка заказа к проекту)."""
    if not inspector.has_table('dlvry_orders'):
        return
    columns = [col['name'] for col in inspector.get_columns('dlvry_orders')]
    if 'project_id' not in columns:
        print("[DLVRY] Добавляем колонку project_id в dlvry_orders...")
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE dlvry_orders ADD COLUMN project_id VARCHAR'))
            conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_orders_project_id ON dlvry_orders (project_id)'))
        print("[DLVRY] ✓ Колонка project_id добавлена")


def _add_vk_profile_id_column(engine: Engine, inspector):
    """
    Добавляет колонку vk_profile_id в dlvry_orders (FK на vk_profiles.id).
    Затем backfill: для всех заказов с непустым vk_user_id создаёт vk_profiles
    и проставляет vk_profile_id + upsert project_members(source='dlvry_order').
    """
    if not inspector.has_table('dlvry_orders'):
        return
    columns = [col['name'] for col in inspector.get_columns('dlvry_orders')]
    if 'vk_profile_id' in columns:
        return

    is_postgres = 'postgresql' in str(engine.url)

    print("[DLVRY] Добавляем колонку vk_profile_id в dlvry_orders...")
    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text(
                'ALTER TABLE dlvry_orders ADD COLUMN vk_profile_id BIGINT '
                'REFERENCES vk_profiles(id) ON DELETE SET NULL'
            ))
        else:
            conn.execute(text(
                'ALTER TABLE dlvry_orders ADD COLUMN vk_profile_id INTEGER'
            ))
        conn.execute(text(
            'CREATE INDEX IF NOT EXISTS ix_dlvry_orders_vk_profile_id '
            'ON dlvry_orders (vk_profile_id)'
        ))
    print("[DLVRY] ✓ Колонка vk_profile_id добавлена")

    # ── Backfill: создать vk_profiles + заполнить vk_profile_id ──
    _backfill_vk_profile_ids(engine)


def _backfill_vk_profile_ids(engine: Engine):
    """
    Backfill vk_profile_id для существующих заказов.
    1. Собирает уникальные vk_user_id из заказов
    2. Upsert в vk_profiles
    3. UPDATE dlvry_orders SET vk_profile_id = ...
    4. Upsert в project_members (source='dlvry_order')
    """
    from sqlalchemy.orm import Session as SASession, sessionmaker
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # 1. Уникальные vk_user_id с непустым значением
        rows = db.execute(text(
            "SELECT DISTINCT vk_user_id FROM dlvry_orders "
            "WHERE vk_user_id IS NOT NULL AND vk_user_id != '' AND vk_profile_id IS NULL"
        )).fetchall()
        vk_ids = [int(r[0]) for r in rows if r[0] and str(r[0]).isdigit() and int(r[0]) > 0]

        if not vk_ids:
            print("[DLVRY] Backfill: нет заказов с vk_user_id для обработки")
            return

        print(f"[DLVRY] Backfill: {len(vk_ids)} уникальных VK-пользователей из заказов")

        # 2. Upsert vk_profiles (батчами по 500)
        from models_library.vk_profiles import VkProfile
        CHUNK = 500
        for i in range(0, len(vk_ids), CHUNK):
            chunk = vk_ids[i:i + CHUNK]
            existing = {
                r.vk_user_id: r.id
                for r in db.query(VkProfile.id, VkProfile.vk_user_id).filter(
                    VkProfile.vk_user_id.in_(chunk)
                ).all()
            }
            new_ids = [vid for vid in chunk if vid not in existing]
            if new_ids:
                db.bulk_insert_mappings(VkProfile, [
                    {'vk_user_id': vid} for vid in new_ids
                ])
                db.flush()

        db.commit()
        print("[DLVRY] Backfill: VK-профили созданы/обновлены")

        # 3. UPDATE dlvry_orders SET vk_profile_id (через Python dict — correlated subquery слишком медленный)
        vk_map = {
            str(r.vk_user_id): r.id
            for r in db.query(VkProfile.id, VkProfile.vk_user_id).all()
        }
        orders = db.execute(text(
            "SELECT rowid, vk_user_id FROM dlvry_orders "
            "WHERE vk_user_id IS NOT NULL AND vk_user_id != '' AND vk_profile_id IS NULL"
        )).fetchall()
        batch = []
        for rowid, vk_uid in orders:
            profile_id = vk_map.get(str(vk_uid))
            if profile_id:
                batch.append({'pid': profile_id, 'rid': rowid})
                if len(batch) >= 5000:
                    db.execute(text(
                        "UPDATE dlvry_orders SET vk_profile_id = :pid WHERE rowid = :rid"
                    ), batch)
                    db.commit()
                    batch = []
        if batch:
            db.execute(text(
                "UPDATE dlvry_orders SET vk_profile_id = :pid WHERE rowid = :rid"
            ), batch)
            db.commit()
        print(f"[DLVRY] Backfill: vk_profile_id проставлен в {len(orders)} заказах")

        # 4. Upsert project_members (source='dlvry_order')
        _backfill_project_members_from_orders(db)
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"[DLVRY] Backfill ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def _backfill_project_members_from_orders(db):
    """
    Создаёт записи project_members для VK-покупателей из заказов.
    Только для тех пар (project_id, vk_profile_id), которых ещё нет.
    """
    from models_library.members import ProjectMember

    # Уникальные пары (project_id, vk_profile_id) из заказов
    rows = db.execute(text(
        "SELECT DISTINCT project_id, vk_profile_id FROM dlvry_orders "
        "WHERE project_id IS NOT NULL AND vk_profile_id IS NOT NULL"
    )).fetchall()

    if not rows:
        return

    pairs = [(r[0], r[1]) for r in rows]
    print(f"[DLVRY] Backfill project_members: {len(pairs)} пар (project, vk_profile)")

    created = 0
    CHUNK = 500
    for i in range(0, len(pairs), CHUNK):
        chunk = pairs[i:i + CHUNK]
        # Проверяем какие уже есть
        existing = set()
        for pid, vpid in chunk:
            exists = db.query(ProjectMember.id).filter(
                ProjectMember.project_id == pid,
                ProjectMember.vk_profile_id == vpid,
            ).first()
            if exists:
                existing.add((pid, vpid))

        new_members = []
        for pid, vpid in chunk:
            if (pid, vpid) not in existing:
                new_members.append({
                    'project_id': pid,
                    'vk_profile_id': vpid,
                    'status': 'customer',
                    'source': 'dlvry_order',
                })

        if new_members:
            db.bulk_insert_mappings(ProjectMember, new_members)
            db.flush()
            created += len(new_members)

    print(f"[DLVRY] Backfill project_members: создано {created} записей (source=dlvry_order)")
