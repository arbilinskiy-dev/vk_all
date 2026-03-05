import React, { useState, useRef, useEffect } from 'react';
import { PeriodType, FilterType, ViewersStats } from './types';

interface UseStoriesDashboardProps {
    /** ID текущего проекта (для перезагрузки при смене проекта без ремаунта) */
    projectId?: string;
    /** Агрегированная демография с бэкенда (из dashboardStats.demographics) */
    demographics: ViewersStats | null;
    /** Перезапрос агрегированной статистики с бэкенда при смене фильтров */
    loadDashboardStats: (periodType?: string, filterType?: string, customStartDate?: string, customEndDate?: string) => void;
}

interface UseStoriesDashboardReturn {
    // Состояния фильтров
    filterType: FilterType;
    setFilterType: (type: FilterType) => void;
    periodType: PeriodType;
    setPeriodType: (type: PeriodType) => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
    
    // Демография зрителей (клиентский расчёт из загруженных историй)
    viewersStats: ViewersStats;
    
    // Анимация
    getCardAnimationClass: (delay: number) => string;
    getCardAnimationStyle: (delay: number) => React.CSSProperties;
}

/**
 * Хук с логикой дашборда статистики историй.
 * 
 * Вся статистика (views, clicks, likes, демография зрителей и т.д.) приходит
 * с бэкенда через /getStoriesDashboardStats — один запрос покрывает ВСЕ истории.
 */
export const useStoriesDashboard = ({ projectId, demographics, loadDashboardStats }: UseStoriesDashboardProps): UseStoriesDashboardReturn => {
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [periodType, setPeriodType] = useState<PeriodType>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    
    // Флаг: анимация карточек уже была запущена (чтобы не перезапускать при обновлении данных)
    const [hasAnimatedCards, setHasAnimatedCards] = useState(false);
    const mountedRef = useRef(false);
    
    useEffect(() => {
        // При первом монтировании запускаем анимацию карточек
        if (!mountedRef.current) {
            mountedRef.current = true;
            const timer = setTimeout(() => setHasAnimatedCards(true), 50);
            return () => clearTimeout(timer);
        }
    }, []);

    // При смене фильтров или проекта — перезапрос агрегированной статистики с бэкенда
    // projectId в deps гарантирует перезагрузку даже если фильтры не изменились (без key-ремаунта)
    useEffect(() => {
        loadDashboardStats(periodType, filterType, customStartDate, customEndDate);
    }, [projectId, periodType, filterType, customStartDate, customEndDate]);

    // Демография зрителей — приходит с бэкенда в dashboardStats.demographics
    const emptyViewersStats: ViewersStats = {
        uniqueCount: 0,
        gender: { male: 0, female: 0, unknown: 0 },
        membership: { members: 0, viral: 0 },
        platform: { android: 0, iphone: 0, ipad: 0, web: 0, other: 0 },
        topCities: [],
        ageGroups: { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 },
    };
    const viewersStats: ViewersStats = demographics ?? emptyViewersStats;

    // Хелпер для классов анимации карточек (не перезапускать анимацию при обновлении данных)
    const getCardAnimationClass = (delay: number) => {
        if (hasAnimatedCards) {
            return ''; // Карточки уже анимированы, показываем сразу
        }
        return 'opacity-0 animate-fade-in-up';
    };
    
    const getCardAnimationStyle = (delay: number) => {
        if (hasAnimatedCards) {
            return {}; // Без задержки, показываем сразу
        }
        return { animationDelay: `${delay}ms`, animationFillMode: 'forwards' as const };
    };

    return {
        filterType,
        setFilterType,
        periodType,
        setPeriodType,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        viewersStats,
        getCardAnimationClass,
        getCardAnimationStyle,
    };
};
