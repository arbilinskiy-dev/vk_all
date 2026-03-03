
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../../services/api';
import { AuthLogEntry, AuthLogsResponse, GetAuthLogsPayload } from '../../../services/api/auth.api';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';

// Маппинг типов событий на читаемые названия и цвета
const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    login_success: { label: 'Вход', color: 'text-green-700', bgColor: 'bg-green-100' },
    login_failed: { label: 'Неудачный вход', color: 'text-red-700', bgColor: 'bg-red-100' },
    logout: { label: 'Выход', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    timeout: { label: 'Таймаут', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    force_logout: { label: 'Принудительный выход', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const EventBadge: React.FC<{ eventType: string }> = ({ eventType }) => {
    const config = EVENT_TYPE_CONFIG[eventType] || { label: eventType, color: 'text-gray-700', bgColor: 'bg-gray-100' };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
            {config.label}
        </span>
    );
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

// Парсинг User-Agent для читаемого отображения
const parseUserAgent = (ua: string | null): string => {
    if (!ua) return '—';
    // Базовый парсинг — показываем сокращённую версию
    if (ua.length > 60) {
        // Пытаемся извлечь браузер
        const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
        if (browserMatch) return browserMatch[0];
        return ua.substring(0, 60) + '...';
    }
    return ua;
};


export const AuthLogsTab: React.FC = () => {
    const [logs, setLogs] = useState<AuthLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Фильтры
    const [filterUser, setFilterUser] = useState<string | null>(null);
    const [filterEvent, setFilterEvent] = useState<string | null>(null);
    const [users, setUsers] = useState<{ user_id: string; username: string }[]>([]);

    // Модалка подтверждения очистки
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const PAGE_SIZE = 30;

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const payload: GetAuthLogsPayload = {
                page,
                page_size: PAGE_SIZE,
                user_id: filterUser,
                event_type: filterEvent,
            };
            const result: AuthLogsResponse = await api.getAuthLogs(payload);
            setLogs(result.logs);
            setTotal(result.total);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ошибка загрузки логов';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [page, filterUser, filterEvent]);

    const fetchUsers = useCallback(async () => {
        try {
            const result = await api.getAuthLogUsers();
            setUsers(result);
        } catch {
            // Не критично
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleClearLogs = async () => {
        setShowClearConfirm(false);
        try {
            const result = await api.clearAuthLogs();
            window.showAppToast?.(`Удалено записей: ${result.deleted}`, 'success');
            setPage(1);
            fetchLogs();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ошибка';
            window.showAppToast?.(`Ошибка: ${msg}`, 'error');
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-4">
            {/* Панель фильтров */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Фильтр по пользователю */}
                <select
                    value={filterUser || ''}
                    onChange={(e) => { setFilterUser(e.target.value || null); setPage(1); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Все пользователи</option>
                    {users.map(u => (
                        <option key={u.user_id} value={u.user_id}>{u.username || u.user_id}</option>
                    ))}
                </select>

                {/* Фильтр по типу события */}
                <select
                    value={filterEvent || ''}
                    onChange={(e) => { setFilterEvent(e.target.value || null); setPage(1); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Все события</option>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>

                <div className="flex-grow" />

                {/* Счётчик */}
                <span className="text-sm text-gray-500">Всего: {total}</span>

                {/* Кнопка очистки */}
                <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                >
                    Очистить логи
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Событие</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Браузер</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Детали</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="loader border-indigo-500 border-t-transparent h-4 w-4"></div>
                                            Загрузка...
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                        Логи авторизации пусты
                                    </td>
                                </tr>
                            ) : logs.map((log, index) => (
                                <tr key={log.id} className="hover:bg-gray-50 opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 15}ms` }}>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">
                                        {log.username || log.details?.attempted_username || '—'}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <EventBadge eventType={log.event_type} />
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-500 font-mono">
                                        {log.ip_address || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-500" title={log.user_agent || ''}>
                                        {parseUserAgent(log.user_agent)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-500">
                                        {log.details ? (
                                            <span className="text-xs text-gray-400">
                                                {JSON.stringify(log.details)}
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                    >
                        ← Назад
                    </button>
                    <span className="text-sm text-gray-600">
                        Страница {page} из {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                    >
                        Вперёд →
                    </button>
                </div>
            )}

            {/* Модалка подтверждения очистки */}
            {showClearConfirm && (
                <ConfirmationModal
                    title="Очистить логи авторизации?"
                    message="Все записи логов авторизации будут удалены. Это действие необратимо."
                    onConfirm={handleClearLogs}
                    onCancel={() => setShowClearConfirm(false)}
                    confirmText="Да, очистить"
                    cancelText="Отмена"
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};
