# Хендлеры: события стены (wall_post_*, wall_schedule_*, wall_repost)
from .post_new import WallPostNewHandler
from .repost import WallRepostHandler
from .schedule_new import WallSchedulePostNewHandler
from .schedule_delete import WallSchedulePostDeleteHandler

WALL_HANDLERS = [
    WallPostNewHandler(),
    WallRepostHandler(),
    WallSchedulePostNewHandler(),
    WallSchedulePostDeleteHandler(),
]

__all__ = [
    'WallPostNewHandler',
    'WallRepostHandler',
    'WallSchedulePostNewHandler',
    'WallSchedulePostDeleteHandler',
    'WALL_HANDLERS',
]
