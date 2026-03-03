import { useState, useEffect, useCallback, useMemo } from 'react';
import { SystemAccount, CompareStats } from '../../../../shared/types';
import * as api from '../../../../services/api';
import { ViewMode } from './constants';

/**
 * Интерфейс саммари-статистики
 */
interface Summary {
    totalCalls: number;
    uniqueMethods: number;
    accountsCount: number;
}

/**
 * Хук для управления логикой компонента TokenLogsAnalytics
 * 
 * Обрабатывает:
 * - Загрузку списка аккаунтов
 * - Загрузку статистики сравнения
 * - Управление выбранными аккаунтами
 * - Переключение режима отображения
 * - Вычисление саммари
 */
export const useTokenLogsAnalytics = () => {
    // Состояния
    const [accounts, setAccounts] = useState<SystemAccount[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<CompareStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('chart');

    // Загрузка списка аккаунтов и автовыбор всех
    useEffect(() => {
        api.getAllSystemAccounts().then(accs => {
            setAccounts(accs);
            // Автоматически выбираем все токены (env + все аккаунты)
            const allIds = new Set(['env', ...accs.map(a => a.id)]);
            setSelectedAccountIds(allIds);
        }).catch(console.error);
    }, []);

    // Загрузка статистики при изменении выбранных аккаунтов
    const loadStats = useCallback(async () => {
        const ids = Array.from(selectedAccountIds);
        if (ids.length === 0) {
            setStats(null);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.getCompareStats(ids as string[]);
            setStats(data);
        } catch (err) {
            console.error('Failed to load compare stats:', err);
            setStats(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedAccountIds]);

    // Дебаунс загрузки статистики
    useEffect(() => {
        const timer = setTimeout(loadStats, 300);
        return () => clearTimeout(timer);
    }, [loadStats]);

    // Массив выбранных ID для передачи в компоненты
    const selectedIdsArray = useMemo(() => Array.from(selectedAccountIds), [selectedAccountIds]);

    // Статистика-саммари
    const summary = useMemo<Summary | null>(() => {
        if (!stats) return null;
        
        const totalCalls = Object.values(stats.stats_data).reduce((sum, methods) => {
            return sum + Object.values(methods).reduce((s, v) => s + v, 0);
        }, 0);

        const uniqueMethods = stats.methods.length;
        const accountsCount = stats.accounts.length;

        return { totalCalls, uniqueMethods, accountsCount };
    }, [stats]);

    // Проверка наличия данных
    const hasData = stats && stats.methods.length > 0;
    const hasSelectedAccounts = selectedAccountIds.size > 0;

    return {
        // Данные
        accounts,
        selectedAccountIds,
        selectedIdsArray,
        stats,
        summary,
        
        // Состояния UI
        isLoading,
        viewMode,
        hasData,
        hasSelectedAccounts,
        
        // Действия
        setSelectedAccountIds,
        setViewMode,
    };
};
