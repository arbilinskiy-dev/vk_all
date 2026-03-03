// Типы для дашборда статистики историй

/** Тип периода фильтрации */
export type PeriodType = 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/** Тип фильтра по типу истории */
export type FilterType = 'all' | 'manual' | 'auto';

/** Агрегированная статистика дашборда */
export interface DashboardStats {
    count: number;
    views: number;
    likes: number;
    replies: number;
    clicks: number;
    shares: number;
    subscribers: number;
    hides: number;
    msg: number;
    ctr: number;
    er: number;
    moneySaved: number;
    /** Среднее просмотров на историю */
    avgViews: number;
    /** Среднее зрителей на историю */
    avgViewers: number;
    /** Минимальное кол-во зрителей у одной истории */
    minViewers: number;
    /** Максимальное кол-во зрителей у одной истории */
    maxViewers: number;
}

/** Точка данных для графиков */
export interface ChartDataPoint {
    views: number;
    likes: number;
    clicks: number;
}

/** Статистика по зрителям */
export interface ViewersStats {
    uniqueCount: number;
    gender: { male: number; female: number; unknown: number };
    membership: { members: number; viral: number };
    platform: { android: number; iphone: number; ipad: number; web: number; other: number };
    topCities: [string, number][];
    ageGroups: { '13-17': number; '18-24': number; '25-34': number; '35-44': number; '45+': number };
}

/** Пропсы для карточек с анимацией */
export interface CardAnimationProps {
    /** CSS-класс анимации (или пустая строка если уже анимировано) */
    animationClass: string;
    /** CSS-стиль с задержкой анимации */
    animationStyle: React.CSSProperties;
}
