
export type ListType = 'subscribers' | 'history_join' | 'history_leave' | 'history_timeline' | 'posts' | 'likes' | 'comments' | 'reposts' | 'mailing' | 'reviews_winners' | 'reviews_participants' | 'reviews_posts' | 'authors';
export type ListGroup = 'subscribers' | 'activities' | 'automations' | 'other';

export type FilterQuality = 'all' | 'active' | 'banned' | 'deleted';
export type FilterSex = 'all' | 'male' | 'female' | 'unknown';
export type FilterOnline = 'any' | 'today' | '3_days' | 'week' | 'month';
export type FilterCanWrite = 'all' | 'allowed' | 'forbidden';

// New filters
export type FilterBdateMonth = 'any' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'unknown';
export type FilterPlatform = 'any' | '1' | '2' | '4' | '7' | 'unknown'; // 1-mobile, 2-iphone, 4-android, 7-web
export type FilterAge = 'any' | 'u16' | '16-20' | '20-25' | '25-30' | '30-35' | '35-40' | '40-45' | '45p' | 'unknown';

export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
export type StatsGroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface RefreshState {
    isRefreshing: boolean;
    label: string | null;
}

/**
 * Группа layout-а для дашборда статистики.
 * Списки с одинаковой структурой дашборда (карточки + графики) 
 * объединены в одну группу — при переключении между ними 
 * React НЕ перемонтирует DOM (нет скелетона, только opacity-overlay).
 */
export const getStatsLayoutGroup = (listType: ListType): string => {
    // Подписчики / Вступившие / Вышедшие / Хронология — одинаковая структура:
    // 4 карточки (Quality, Geo, Demographics, Platforms/Online) + 2 графика (Age, Birthday)
    if (['subscribers', 'history_join', 'history_leave', 'history_timeline'].includes(listType)) {
        return 'user_stats_default';
    }
    // Остальные списки — уникальный ключ (полный перемонт при переключении)
    return listType;
};
