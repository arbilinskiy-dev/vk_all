"""Общий дашборд статистики историй по всем проектам (предпрод)."""
import sys, json, re
from datetime import datetime, timezone

sys.path.insert(0, '.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models_library.automations import StoriesAutomationLog
from models_library.projects import Project

DB_URL = 'postgresql+psycopg2://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1'
engine = create_engine(DB_URL, connect_args={'connect_timeout': 10})
Session = sessionmaker(bind=engine)
db = Session()

# === Загрузка данных ===
logs = db.query(StoriesAutomationLog).order_by(StoriesAutomationLog.created_at.asc()).all()
print(f'Всего записей в stories_automation_logs: {len(logs)}')

project_ids = set(log.project_id for log in logs)
projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
project_names = {p.id: p.name for p in projects}
print(f'Количество проектов с историями: {len(project_ids)}')
for pid in project_ids:
    name = project_names.get(pid, '???')
    count = sum(1 for l in logs if l.project_id == pid)
    print(f'  - {name}: {count} записей')


# === Хелперы ===
def extract_story_id(log_json):
    if not log_json:
        return None
    try:
        data = json.loads(log_json)
        link = data.get('story_link', '')
        match = re.search(r'story-?\d+_(\d+)', link)
        if match:
            return int(match.group(1))
    except:
        pass
    return None

def get_count(field):
    if not field:
        return 0
    if isinstance(field, (int, float)):
        return int(field)
    if isinstance(field, dict) and 'count' in field:
        return field['count']
    return 0


# === Агрегация числовых метрик ===
seen = set()
totals = {'count': 0, 'views': 0, 'likes': 0, 'replies': 0, 'clicks': 0,
          'shares': 0, 'subscribers': 0, 'hides': 0, 'msg': 0}
per_story_views = []
per_story_viewers = []
auto_count = 0
manual_count = 0

for log in logs:
    story_id = extract_story_id(log.log)
    if story_id:
        if story_id in seen:
            continue
        seen.add(story_id)

    totals['count'] += 1

    if log.vk_post_id and log.vk_post_id > 0:
        auto_count += 1
    else:
        manual_count += 1

    views = 0
    if log.stats:
        try:
            s = json.loads(log.stats)
            views = get_count(s.get('views'))
            likes = get_count(s.get('likes'))
            replies = get_count(s.get('replies'))
            answer = get_count(s.get('answer'))
            clicks = get_count(s.get('open_link'))
            shares = get_count(s.get('shares'))
            subscribers = get_count(s.get('subscribers'))
            hides = get_count(s.get('bans'))

            totals['views'] += views
            totals['likes'] += likes
            totals['replies'] += replies + answer
            totals['clicks'] += clicks
            totals['shares'] += shares
            totals['subscribers'] += subscribers
            totals['hides'] += hides
            totals['msg'] += answer
        except:
            pass
    per_story_views.append(views)

    viewer_count = 0
    if log.viewers:
        try:
            vd = json.loads(log.viewers)
            items = vd.get('items') or []
            viewer_count = len(items)
        except:
            pass
    per_story_viewers.append(viewer_count)

# Производные метрики
ctr = round((totals['clicks'] / totals['views']) * 100, 2) if totals['views'] > 0 else 0
engagements = totals['likes'] + totals['shares'] + totals['replies'] + totals['msg']
er = round((engagements / totals['views']) * 100, 2) if totals['views'] > 0 else 0
money_saved = int((totals['views'] / 1000) * 150)

cnt = totals['count']
avg_views = round(sum(per_story_views) / cnt, 1) if cnt > 0 else 0
avg_viewers = round(sum(per_story_viewers) / cnt, 1) if cnt > 0 else 0
viewers_with_data = [v for v in per_story_viewers if v > 0]
min_viewers = min(viewers_with_data) if viewers_with_data else 0
max_viewers = max(viewers_with_data) if viewers_with_data else 0


# === Демография зрителей ===
all_viewers = {}
gender_count = {'male': 0, 'female': 0, 'unknown': 0}
membership_count = {'members': 0, 'viral': 0}
platform_count = {'android': 0, 'iphone': 0, 'ipad': 0, 'web': 0, 'other': 0}
city_count = {}
age_groups = {'13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0}
current_year = datetime.now().year

for log in logs:
    if not log.viewers:
        continue
    try:
        viewers_data = json.loads(log.viewers)
        items = viewers_data.get('items') or []
        for viewer in items:
            uid = viewer.get('user_id')
            if not uid or uid in all_viewers:
                continue
            all_viewers[uid] = True
            is_member = viewer.get('is_member')
            if is_member is True:
                membership_count['members'] += 1
            elif is_member is False:
                membership_count['viral'] += 1
            user = viewer.get('user') or {}
            sex = user.get('sex')
            if sex == 2:
                gender_count['male'] += 1
            elif sex == 1:
                gender_count['female'] += 1
            else:
                gender_count['unknown'] += 1
            city = user.get('city')
            if city:
                city_count[city] = city_count.get(city, 0) + 1
            platform = user.get('platform')
            if platform == 4: platform_count['android'] += 1
            elif platform == 2: platform_count['iphone'] += 1
            elif platform == 3: platform_count['ipad'] += 1
            elif platform == 7: platform_count['web'] += 1
            elif platform: platform_count['other'] += 1
            bdate = user.get('bdate', '')
            if bdate:
                parts = bdate.split('.')
                if len(parts) == 3:
                    try:
                        birth_year = int(parts[2])
                        age = current_year - birth_year
                        if 13 <= age <= 17: age_groups['13-17'] += 1
                        elif 18 <= age <= 24: age_groups['18-24'] += 1
                        elif 25 <= age <= 34: age_groups['25-34'] += 1
                        elif 35 <= age <= 44: age_groups['35-44'] += 1
                        elif age >= 45: age_groups['45+'] += 1
                    except:
                        pass
    except:
        continue

top_cities = sorted(city_count.items(), key=lambda x: x[1], reverse=True)[:10]


# === ВЫВОД ===
print()
print('=' * 60)
print('  ОБЩИЙ ДАШБОРД ИСТОРИЙ (ВСЕ ПРОЕКТЫ, ВСЁ ВРЕМЯ)')
print('=' * 60)
print()
print(f'  Уникальных историй:     {totals["count"]}')
print(f'    - автоматических:      {auto_count}')
print(f'    - ручных:              {manual_count}')
print()
print(f'  Просмотры (views):       {totals["views"]:,}')
print(f'  Лайки (likes):           {totals["likes"]:,}')
print(f'  Ответы (replies):        {totals["replies"]:,}')
print(f'  Клики (open_link):       {totals["clicks"]:,}')
print(f'  Репосты (shares):        {totals["shares"]:,}')
print(f'  Подписки (subscribers):  {totals["subscribers"]:,}')
print(f'  Скрытия (bans):          {totals["hides"]:,}')
print(f'  Сообщения (answer):      {totals["msg"]:,}')
print()
print(f'  CTR:                     {ctr}%')
print(f'  ER:                      {er}%')
print(f'  Экономия бюджета:        {money_saved:,} руб.')
print()
print(f'  Ср. просмотров/историю:  {avg_views}')
print(f'  Ср. зрителей/историю:    {avg_viewers}')
print(f'  Мин. зрителей:           {min_viewers}')
print(f'  Макс. зрителей:          {max_viewers}')
print()
print('--- ДЕМОГРАФИЯ УНИКАЛЬНЫХ ЗРИТЕЛЕЙ ---')
print(f'  Уникальных зрителей:     {len(all_viewers):,}')
print()
print(f'  Пол:')
print(f'    Мужчины:               {gender_count["male"]:,}')
print(f'    Женщины:               {gender_count["female"]:,}')
print(f'    Не указан:             {gender_count["unknown"]:,}')
print()
print(f'  Подписка:')
print(f'    Подписчики:            {membership_count["members"]:,}')
print(f'    Виральные (не подп.):  {membership_count["viral"]:,}')
print()
print(f'  Платформа:')
for k, v in platform_count.items():
    print(f'    {k:20s}    {v:,}')
print()
print(f'  Возрастные группы:')
for k, v in age_groups.items():
    print(f'    {k:20s}    {v:,}')
print()
print(f'  Топ-10 городов:')
for city, cnt_city in top_cities:
    print(f'    {city:25s}  {cnt_city:,}')
print()
print('=' * 60)

db.close()
