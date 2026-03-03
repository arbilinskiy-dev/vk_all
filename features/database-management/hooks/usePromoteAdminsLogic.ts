
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Project, SystemAccount } from '../../../shared/types';
import { promoteToAdmins, PromoteToAdminsResponse, PromoteUserResult } from '../../../services/api/management.api';
import { getAllSystemAccounts } from '../../../services/api/system_accounts.api';

// ─── Типы ─────────────────────────────────────────────────────────

interface UsePromoteAdminsLogicProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
}

// ─── Группированные результаты ────────────────────────────────────

export interface GroupedResults {
    promoted: PromoteUserResult[];
    alreadyAdmin: PromoteUserResult[];
    joinedOnly: PromoteUserResult[];
    failedJoin: PromoteUserResult[];
    failedPromote: PromoteUserResult[];
    recommendations: string[];
}

// ─── Хук ──────────────────────────────────────────────────────────

export function usePromoteAdminsLogic({ isOpen, onClose, projects }: UsePromoteAdminsLogicProps) {
    // ─── Состояние ────────────────────────────────────────────────
    const [systemAccounts, setSystemAccounts] = useState<SystemAccount[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
    
    // Выбранные проекты и системные страницы
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
    
    // Роль для назначения
    const [role, setRole] = useState<'administrator' | 'editor' | 'moderator'>('administrator');
    
    // Процесс выполнения
    const [isRunning, setIsRunning] = useState(false);
    const [response, setResponse] = useState<PromoteToAdminsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Поиск
    const [projectSearch, setProjectSearch] = useState('');
    const [accountSearch, setAccountSearch] = useState('');

    // ─── Загрузка системных аккаунтов ─────────────────────────────
    useEffect(() => {
        if (isOpen && systemAccounts.length === 0) {
            setIsLoadingAccounts(true);
            getAllSystemAccounts()
                .then(accounts => {
                    // Только активные аккаунты с токенами
                    setSystemAccounts(accounts.filter(a => a.status === 'active'));
                })
                .catch(err => {
                    console.error('Ошибка загрузки системных аккаунтов:', err);
                })
                .finally(() => setIsLoadingAccounts(false));
        }
    }, [isOpen]);

    // ─── Фильтрация проектов ─────────────────────────────────────
    // Только проекты с vkProjectId (привязанные к VK группе)
    const eligibleProjects = useMemo(() => {
        return projects.filter(p => p.vkProjectId && !p.archived);
    }, [projects]);

    const filteredProjects = useMemo(() => {
        if (!projectSearch.trim()) return eligibleProjects;
        const q = projectSearch.toLowerCase();
        return eligibleProjects.filter(p => 
            p.name.toLowerCase().includes(q) ||
            p.vkGroupName?.toLowerCase().includes(q) ||
            String(p.vkProjectId).includes(q)
        );
    }, [eligibleProjects, projectSearch]);

    // ─── Фильтрация системных аккаунтов ──────────────────────────
    const filteredAccounts = useMemo(() => {
        if (!accountSearch.trim()) return systemAccounts;
        const q = accountSearch.toLowerCase();
        return systemAccounts.filter(a =>
            a.full_name?.toLowerCase().includes(q) ||
            String(a.vk_user_id).includes(q)
        );
    }, [systemAccounts, accountSearch]);

    // ─── Обработчики выбора ──────────────────────────────────────
    const toggleProject = useCallback((id: string) => {
        setSelectedProjectIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const toggleAccount = useCallback((id: string) => {
        setSelectedAccountIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const selectAllProjects = useCallback(() => {
        setSelectedProjectIds(new Set(filteredProjects.map(p => p.id)));
    }, [filteredProjects]);

    const deselectAllProjects = useCallback(() => {
        setSelectedProjectIds(new Set());
    }, []);

    const selectAllAccounts = useCallback(() => {
        setSelectedAccountIds(new Set(filteredAccounts.map(a => a.id)));
    }, [filteredAccounts]);

    const deselectAllAccounts = useCallback(() => {
        setSelectedAccountIds(new Set());
    }, []);

    // ─── Запуск операции ─────────────────────────────────────────
    const handleStart = useCallback(async () => {
        // Собираем group_ids из выбранных проектов
        const groupIds = eligibleProjects
            .filter(p => selectedProjectIds.has(p.id))
            .map(p => p.vkProjectId!)
            .filter(Boolean);
        
        // Собираем user_ids из выбранных системных аккаунтов
        const userIds = systemAccounts
            .filter(a => selectedAccountIds.has(a.id))
            .map(a => Number(a.vk_user_id))
            .filter(Boolean);
        
        if (groupIds.length === 0 || userIds.length === 0) return;

        setIsRunning(true);
        setError(null);
        setResponse(null);

        try {
            const result = await promoteToAdmins(groupIds, userIds, role);
            setResponse(result);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при выполнении операции');
        } finally {
            setIsRunning(false);
        }
    }, [eligibleProjects, systemAccounts, selectedProjectIds, selectedAccountIds, role]);

    // ─── Сброс и закрытие ────────────────────────────────────────
    const handleClose = useCallback(() => {
        if (isRunning) return; // Не закрываем во время выполнения
        setSelectedProjectIds(new Set());
        setSelectedAccountIds(new Set());
        setResponse(null);
        setError(null);
        setProjectSearch('');
        setAccountSearch('');
        setRole('administrator');
        onClose();
    }, [isRunning, onClose]);

    const handleBack = useCallback(() => {
        setResponse(null);
        setError(null);
    }, []);

    // ─── Группировка результатов ──────────────────────────────────
    const groupedResults = useMemo((): GroupedResults | null => {
        if (!response) return null;
        const r = response.results;
        // Назначены админом (promoted=true)
        const promoted = r.filter(x => x.promoted);
        // Уже были админами
        const alreadyAdmin = r.filter(x => x.already_admin);
        // Вступили, но НЕ назначены (joined=true, promoted=false, already_admin=false)
        const joinedOnly = r.filter(x => x.joined && !x.promoted && !x.already_admin);
        // Не удалось ни вступить, ни назначить (error есть, joined=false)
        const failedJoin = r.filter(x => x.error && !x.joined && !x.was_member);
        // Вступили/были участниками, но назначение не удалось (error есть, joined или was_member)
        const failedPromote = r.filter(x => x.error && (x.joined || x.was_member) && !x.promoted && !x.already_admin);
        // Уникальные рекомендации (для блока «Что делать»)
        const recSet = new Set<string>(r.filter(x => x.recommendation).map(x => x.recommendation as string));
        const recommendations: string[] = Array.from(recSet);
        return { promoted, alreadyAdmin, joinedOnly, failedJoin, failedPromote, recommendations };
    }, [response]);

    // ─── Вычисляемые значения ─────────────────────────────────────
    const selectedProjectCount = selectedProjectIds.size;
    const selectedAccountCount = selectedAccountIds.size;
    const totalPairs = selectedProjectCount * selectedAccountCount;
    const canStart = selectedProjectCount > 0 && selectedAccountCount > 0 && !isRunning;

    // ─── Return ───────────────────────────────────────────────────
    return {
        state: {
            // Данные
            systemAccounts,
            isLoadingAccounts,
            filteredProjects,
            filteredAccounts,
            // Выбор
            selectedProjectIds,
            selectedAccountIds,
            selectedProjectCount,
            selectedAccountCount,
            // Роль
            role,
            // Процесс
            isRunning,
            response,
            error,
            groupedResults,
            // Вычисляемые
            totalPairs,
            canStart,
            // Поиск
            projectSearch,
            accountSearch,
        },
        actions: {
            // Выбор
            toggleProject,
            toggleAccount,
            selectAllProjects,
            deselectAllProjects,
            selectAllAccounts,
            deselectAllAccounts,
            // Роль
            setRole,
            // Поиск
            setProjectSearch,
            setAccountSearch,
            // Операции
            handleStart,
            handleClose,
            handleBack,
        },
    };
}
