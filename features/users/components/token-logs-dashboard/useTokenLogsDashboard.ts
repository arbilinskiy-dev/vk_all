import { useState, useEffect, useCallback, useRef } from 'react';
import { TokenLog, SystemAccount, Project, AiTokenLog, AiToken } from '../../../../shared/types';
import * as api from '../../../../services/api';
import { GetLogsFilters } from '../../../../services/api/system_accounts.api';
import { GetAiLogsFilters } from '../../../../services/api/ai_token.api';
import { ConfirmAction, StatusFilter, SelectOption } from './types';
import { getConfirmMessage } from './helpers';

interface UseTokenLogsDashboardProps {
    mode: 'vk' | 'ai';
}

/**
 * Хук для управления логикой TokenLogsDashboard
 * 
 * Обрабатывает:
 * - Загрузку данных (аккаунты, проекты, токены, логи)
 * - Infinite scroll
 * - Фильтрацию и поиск
 * - Выбор и удаление записей
 */
export const useTokenLogsDashboard = ({ mode }: UseTokenLogsDashboardProps) => {
    const activeTab = mode;
    
    // --- VK Logs State ---
    const [vkLogs, setVkLogs] = useState<TokenLog[]>([]);
    const [vkAccounts, setVkAccounts] = useState<SystemAccount[]>([]);
    const [vkProjects, setVkProjects] = useState<Project[]>([]);
    const [vkSelectedAccountIds, setVkSelectedAccountIds] = useState<Set<string>>(new Set());
    
    // --- AI Logs State ---
    const [aiLogs, setAiLogs] = useState<AiTokenLog[]>([]);
    const [aiTokens, setAiTokens] = useState<AiToken[]>([]);
    const [aiSelectedTokenIds, setAiSelectedTokenIds] = useState<Set<string>>(new Set());
    
    // --- Infinite Scroll State ---
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    
    // --- Состояние выбора записей для удаления ---
    const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    
    // --- Модальное окно подтверждения ---
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    
    // Ref для контейнера скролла
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Загрузка справочников (один раз)
    useEffect(() => {
        api.getAllSystemAccounts().then(setVkAccounts).catch(console.error);
        api.getAllProjectsForManagement().then(setVkProjects).catch(console.error);
        api.getAllAiTokens().then(setAiTokens).catch(console.error);
    }, []);

    // Функция начальной загрузки логов
    const fetchLogsInitial = useCallback(async (options?: { soft?: boolean }) => {
        // Мягкое обновление — не скрываем таблицу, только крутим иконку
        const isSoft = options?.soft === true;
        if (isSoft) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setPage(1);
        try {
            if (activeTab === 'vk') {
                const filters: GetLogsFilters = {
                    accountIds: Array.from(vkSelectedAccountIds) as string[],
                    searchQuery: searchQuery || undefined,
                    status: statusFilter
                };
                const data = await api.getLogs(1, pageSize, filters);
                setVkLogs(data.items);
                setTotalCount(data.total_count);
                setHasMore(data.items.length >= pageSize && data.items.length < data.total_count);
            } else {
                const filters: GetAiLogsFilters = {
                    tokenIds: Array.from(aiSelectedTokenIds) as string[],
                    searchQuery: searchQuery || undefined,
                    status: statusFilter
                };
                const data = await api.getAiLogs(1, pageSize, filters);
                setAiLogs(data.items);
                setTotalCount(data.total_count);
                setHasMore(data.items.length >= pageSize && data.items.length < data.total_count);
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab, pageSize, vkSelectedAccountIds, aiSelectedTokenIds, searchQuery, statusFilter]);

    // Функция подгрузки следующей страницы
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        
        setIsLoadingMore(true);
        const nextPage = page + 1;
        
        try {
            if (activeTab === 'vk') {
                const filters: GetLogsFilters = {
                    accountIds: Array.from(vkSelectedAccountIds) as string[],
                    searchQuery: searchQuery || undefined,
                    status: statusFilter
                };
                const data = await api.getLogs(nextPage, pageSize, filters);
                setVkLogs(prev => [...prev, ...data.items]);
                setHasMore(data.items.length >= pageSize && (vkLogs.length + data.items.length) < data.total_count);
            } else {
                const filters: GetAiLogsFilters = {
                    tokenIds: Array.from(aiSelectedTokenIds) as string[],
                    searchQuery: searchQuery || undefined,
                    status: statusFilter
                };
                const data = await api.getAiLogs(nextPage, pageSize, filters);
                setAiLogs(prev => [...prev, ...data.items]);
                setHasMore(data.items.length >= pageSize && (aiLogs.length + data.items.length) < data.total_count);
            }
            setPage(nextPage);
        } catch (err) {
            console.error("Failed to load more logs:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [activeTab, page, pageSize, vkSelectedAccountIds, aiSelectedTokenIds, searchQuery, statusFilter, isLoadingMore, hasMore, vkLogs.length, aiLogs.length]);

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || isLoadingMore || !hasMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 200) {
            loadMore();
        }
    }, [loadMore, isLoadingMore, hasMore]);

    // Подписка на скролл
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    // Дебаунс для поиска и фильтров
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogsInitial();
        }, 500);
        return () => clearTimeout(timer);
    }, [vkSelectedAccountIds, aiSelectedTokenIds, searchQuery, statusFilter]);
    
    // Сброс при смене режима
    useEffect(() => {
        setSearchQuery('');
        setStatusFilter('all');
        setTotalCount(0);
        setHasMore(true);
        setPage(1);
        setSelectedLogIds(new Set());
        if (mode === 'vk') {
            setVkLogs([]);
        } else {
            setAiLogs([]);
        }
        fetchLogsInitial();
    }, [mode]);

    // --- Функции выбора записей ---
    const toggleSelectLog = (id: string) => {
        setSelectedLogIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        const currentLogs = activeTab === 'vk' ? vkLogs : aiLogs;
        if (selectedLogIds.size === currentLogs.length) {
            setSelectedLogIds(new Set());
        } else {
            setSelectedLogIds(new Set(currentLogs.map(l => l.id)));
        }
    };

    // --- Функции удаления ---
    const handleDeleteOne = (id: string) => {
        setDeleteTargetId(id);
        setConfirmAction('deleteOne');
    };

    const handleDeleteSelected = () => {
        if (selectedLogIds.size === 0) return;
        setConfirmAction('deleteSelected');
    };

    const handleDeleteAll = () => {
        setConfirmAction('deleteAll');
    };

    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            if (confirmAction === 'deleteOne' && deleteTargetId !== null) {
                if (activeTab === 'vk') {
                    await api.deleteVkLog(deleteTargetId);
                } else {
                    await api.deleteAiLog(deleteTargetId);
                }
                window.showAppToast?.('Запись удалена', 'success');
            } else if (confirmAction === 'deleteSelected') {
                const ids: string[] = Array.from(selectedLogIds);
                if (activeTab === 'vk') {
                    await api.deleteVkLogsBatch(ids.map(id => parseInt(id)));
                } else {
                    await api.deleteAiLogsBatch(ids.map(id => parseInt(id)));
                }
                window.showAppToast?.(`Удалено ${selectedLogIds.size} записей`, 'success');
            } else if (confirmAction === 'deleteAll') {
                if (activeTab === 'vk') {
                    await api.clearLogs(null);
                } else {
                    await api.clearAiLogs(null);
                }
                window.showAppToast?.('Все логи удалены', 'success');
            }
            setSelectedLogIds(new Set());
            fetchLogsInitial();
        } catch (err) {
            console.error(err);
            window.showAppToast?.('Не удалось удалить', 'error');
        } finally {
            setIsDeleting(false);
            setConfirmAction(null);
            setDeleteTargetId(null);
        }
    };

    const cancelDelete = () => {
        setConfirmAction(null);
        setDeleteTargetId(null);
    };

    // Опции для мультиселектов
    const vkOptions: SelectOption[] = [
        { id: 'env', label: 'ENV TOKEN' },
        ...vkAccounts.map(a => ({ id: a.id, label: a.full_name }))
    ];
    
    const aiOptions: SelectOption[] = [
        { id: 'env', label: 'ENV TOKEN' },
        ...aiTokens.map(t => ({ id: t.id, label: t.description || 'Без названия' }))
    ];

    const currentLogs = activeTab === 'vk' ? vkLogs : aiLogs;
    const currentLogsCount = currentLogs.length;
    const confirmMessage = getConfirmMessage(confirmAction, selectedLogIds.size, activeTab);

    return {
        // Режим
        activeTab,
        
        // VK данные
        vkLogs,
        vkAccounts,
        vkProjects,
        vkSelectedAccountIds,
        setVkSelectedAccountIds,
        vkOptions,
        
        // AI данные
        aiLogs,
        aiTokens,
        aiSelectedTokenIds,
        setAiSelectedTokenIds,
        aiOptions,
        
        // Состояния загрузки
        isLoading,
        isRefreshing,
        isLoadingMore,
        isDeleting,
        hasMore,
        totalCount,
        currentLogsCount,
        
        // Фильтры
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        
        // Выбор записей
        selectedLogIds,
        toggleSelectLog,
        toggleSelectAll,
        
        // Удаление
        confirmAction,
        confirmMessage,
        handleDeleteOne,
        handleDeleteSelected,
        handleDeleteAll,
        executeDelete,
        cancelDelete,
        
        // Infinite scroll
        scrollContainerRef,
        loadMore,
        fetchLogsInitial,
    };
};
