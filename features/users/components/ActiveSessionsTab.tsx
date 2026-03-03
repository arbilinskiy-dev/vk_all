
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../../services/api';
import { ActiveSession } from '../../../services/api/auth.api';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';

// Интервал автообновления (30 сек)
const AUTO_REFRESH_INTERVAL = 30_000;

// Парсинг User-Agent для читаемого отображения
const parseUserAgent = (ua: string | null): string => {
    if (!ua) return '—';
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    if (browserMatch) return browserMatch[0];
    if (ua.length > 50) return ua.substring(0, 50) + '...';
    return ua;
};

// Форматирование даты
const formatDate = (isoString: string | null): string => {
    if (!isoString) return '—';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return isoString;
    }
};

// Форматирование длительности
const formatDuration = (minutes: number | null): string => {
    if (minutes === null || minutes === undefined) return '—';
    if (minutes < 1) return 'меньше минуты';
    if (minutes < 60) return `${Math.round(minutes)} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}ч ${mins}м`;
};

// Индикатор статуса: зелёный (<2мин), жёлтый (<10мин), серый (>10мин)
const StatusIndicator: React.FC<{ idleMinutes: number | null }> = ({ idleMinutes }) => {
    if (idleMinutes === null) return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />;
    
    let color = 'bg-green-500'; // Активен
    let label = 'Активен';
    
    if (idleMinutes > 10) {
        color = 'bg-gray-400';
        label = 'Неактивен';
    } else if (idleMinutes > 2) {
        color = 'bg-yellow-400';
        label = 'Отошёл';
    }
    
    return (
        <span className="flex items-center gap-1.5" title={label}>
            <span className={`w-2.5 h-2.5 rounded-full ${color} ${idleMinutes <= 2 ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-gray-500">{label}</span>
        </span>
    );
};

// Бейдж роли
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const isAdmin = role === 'admin';
    return (
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isAdmin ? 'Админ' : 'Пользователь'}
        </span>
    );
};


export const ActiveSessionsTab: React.FC = () => {
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Модалка подтверждения завершения сессии
    const [terminateTarget, setTerminateTarget] = useState<ActiveSession | null>(null);
    const [isTerminating, setIsTerminating] = useState(false);

    // Ссылка на интервал для автообновления
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchSessions = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const result = await api.getActiveSessions();
            setSessions(result.sessions);
            setTotal(result.total);
            setLastUpdated(new Date());
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ошибка загрузки сессий';
            if (!silent) setError(msg);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    // Первая загрузка + автообновление
    useEffect(() => {
        fetchSessions();
        intervalRef.current = setInterval(() => fetchSessions(true), AUTO_REFRESH_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchSessions]);

    const handleTerminate = async () => {
        if (!terminateTarget) return;
        setIsTerminating(true);
        try {
            const result = await api.terminateSession(terminateTarget.id);
            if (result.success) {
                window.showAppToast?.(`Сессия пользователя «${terminateTarget.username}» завершена`, 'success');
                fetchSessions(true);
            } else {
                window.showAppToast?.(result.message || 'Не удалось завершить сессию', 'error');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ошибка';
            window.showAppToast?.(`Ошибка: ${msg}`, 'error');
        } finally {
            setIsTerminating(false);
            setTerminateTarget(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Панель */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">
                        Сейчас в сети: <span className="text-green-600 font-bold">{total}</span>
                    </span>
                </div>

                <div className="flex-grow" />

                {lastUpdated && (
                    <span className="text-xs text-gray-400">
                        Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                    </span>
                )}

                <button
                    onClick={() => fetchSessions()}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50 disabled:opacity-40 flex items-center gap-1.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Обновить
                </button>
            </div>

            {/* Таблица */}
            {error ? (
                <div className="text-center text-red-600 p-8 bg-red-50 rounded-lg">{error}</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Браузер</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Вход</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Посл. активность</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Длительность</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="loader border-indigo-500 border-t-transparent h-4 w-4"></div>
                                            Загрузка...
                                        </div>
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                        Нет активных сессий
                                    </td>
                                </tr>
                            ) : sessions.map((session, index) => (
                                <tr
                                    key={session.id}
                                    className="hover:bg-gray-50 opacity-0 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 20}ms` }}
                                >
                                    <td className="px-4 py-2.5">
                                        <StatusIndicator idleMinutes={session.idle_minutes} />
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">
                                        {session.username}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <RoleBadge role={session.role} />
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-500 font-mono">
                                        {session.ip_address || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-500" title={session.user_agent || ''}>
                                        {parseUserAgent(session.user_agent)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                                        {formatDate(session.created_at)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                                        {formatDate(session.last_activity)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-500 whitespace-nowrap">
                                        {formatDuration(session.session_duration_minutes)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <button
                                            onClick={() => setTerminateTarget(session)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                            title="Завершить сессию"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Подсказка */}
            <p className="text-xs text-gray-400 text-center">
                Автообновление каждые 30 секунд. Сессия считается «неактивной» при бездействии более 10 минут.
            </p>

            {/* Модалка подтверждения завершения сессии */}
            {terminateTarget && (
                <ConfirmationModal
                    title="Завершить сессию?"
                    message={`Вы собираетесь принудительно завершить сессию пользователя «${terminateTarget.username}».\n\nПользователь будет разлогинен.`}
                    onConfirm={handleTerminate}
                    onCancel={() => setTerminateTarget(null)}
                    confirmText="Да, завершить"
                    cancelText="Отмена"
                    isConfirming={isTerminating}
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};
