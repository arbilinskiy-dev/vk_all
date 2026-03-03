/**
 * Хук для управления состоянием "пользователь печатает" и "менеджер в диалоге".
 * 
 * Typing: 
 * - Приходит SSE user_typing → добавляем vk_user_id в Map с таймером 5 сек
 * - Через 5 сек без повторного события — убираем (пользователь перестал печатать)
 * 
 * Dialog Focus:
 * - Приходит SSE dialog_focus → обновляем Map (enter/leave)
 * - Начальное состояние загружается через GET /dialog-focuses
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { SSEUserTypingData, SSEDialogFocusData } from '../../types';
import { getDialogFocuses } from '../../../../services/api/messages.api';
import { getManagerId } from '../../utils/getManagerId';
import { msgLog, msgWarn, fmtUser, fmtProject } from '../../utils/messagesLogger';

/** Таймаут typing-индикатора (мс) — VK обычно шлёт событие каждые ~5 сек */
const TYPING_TIMEOUT_MS = 6000;

/** Информация о менеджере в диалоге */
export interface ManagerFocusInfo {
    managerId: string;
    managerName: string;
}

interface UseTypingStateResult {
    /** Set vk_user_id пользователей, которые сейчас печатают */
    typingUsers: Set<number>;
    /** Map: vk_user_id → список менеджеров, которые сейчас в этом диалоге */
    dialogFocuses: Map<number, ManagerFocusInfo[]>;
    /** Обработчик SSE user_typing */
    handleUserTyping: (data: SSEUserTypingData) => void;
    /** Обработчик SSE dialog_focus */
    handleDialogFocus: (data: SSEDialogFocusData, myManagerId: string) => void;
}

export function useTypingState(projectId: string | null): UseTypingStateResult {
    // Typing: Set<vk_user_id> для быстрой проверки
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    // Таймеры для auto-expire typing (5 сек)
    const typingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    // Dialog Focus: Map<vk_user_id, ManagerFocusInfo[]>
    const [dialogFocuses, setDialogFocuses] = useState<Map<number, ManagerFocusInfo[]>>(new Map());

    // Ref на текущий projectId — для проверки в useCallback без пересоздания
    const projectIdRef = useRef(projectId);
    projectIdRef.current = projectId;

    // --- Typing ---
    const handleUserTyping = useCallback((data: SSEUserTypingData) => {
        const { vk_user_id } = data;
        msgLog('TYPING', `⌨️ Пользователь ${fmtUser(vk_user_id)} печатает`);

        // Добавляем пользователя в set
        setTypingUsers(prev => {
            if (prev.has(vk_user_id)) return prev;
            const next = new Set(prev);
            next.add(vk_user_id);
            return next;
        });

        // Сбрасываем предыдущий таймер
        const existingTimer = typingTimersRef.current.get(vk_user_id);
        if (existingTimer) clearTimeout(existingTimer);

        // Ставим новый таймер — через 6 сек убираем
        const timer = setTimeout(() => {
            msgLog('TYPING', `⏰ Таймаут печати ${fmtUser(vk_user_id)} — убираем индикатор`);
            setTypingUsers(prev => {
                if (!prev.has(vk_user_id)) return prev;
                const next = new Set(prev);
                next.delete(vk_user_id);
                return next;
            });
            typingTimersRef.current.delete(vk_user_id);
        }, TYPING_TIMEOUT_MS);

        typingTimersRef.current.set(vk_user_id, timer);
    }, []);

    // --- Dialog Focus ---
    const handleDialogFocus = useCallback((data: SSEDialogFocusData, myManagerId: string) => {
        const { vk_user_id, manager_id, manager_name, action, project_id } = data;

        // Игнорируем свои собственные события
        if (manager_id === myManagerId) {
            msgLog('DIALOG_FOCUS', `👥 dialog_focus: собственное событие (${action}), пропуск`);
            return;
        }

        // Защита от кросс-проектных гонок: игнорируем события от другого проекта
        if (project_id && projectIdRef.current && project_id !== projectIdRef.current) {
            msgLog('DIALOG_FOCUS', `👥 dialog_focus: событие от другого проекта (${project_id} ≠ ${projectIdRef.current}), пропуск`);
            return;
        }

        msgLog('DIALOG_FOCUS', `👥 dialog_focus: ${manager_name} (${manager_id}) ${action === 'enter' ? 'вошёл в' : 'покинул'} диалог ${fmtUser(vk_user_id)}`);

        setDialogFocuses(prev => {
            const next = new Map<number, ManagerFocusInfo[]>(prev);
            const current = next.get(vk_user_id) || [];

            if (action === 'enter') {
                // Добавляем менеджера (если ещё нет)
                if (!current.some(m => m.managerId === manager_id)) {
                    next.set(vk_user_id, [...current, { managerId: manager_id, managerName: manager_name }]);
                }
            } else if (action === 'leave') {
                // Убираем менеджера
                const filtered = current.filter(m => m.managerId !== manager_id);
                if (filtered.length > 0) {
                    next.set(vk_user_id, filtered);
                } else {
                    next.delete(vk_user_id);
                }
            }

            return next;
        });
    }, []);

    // Сброс typing при смене проекта — чтобы статус «печатает» не «перетекал» между проектами
    useEffect(() => {
        setTypingUsers(new Set());
        typingTimersRef.current.forEach(timer => clearTimeout(timer));
        typingTimersRef.current.clear();
    }, [projectId]);

    // Загрузка начальных фокусов при подключении
    useEffect(() => {
        // Моментальная очистка — убираем стейл от предыдущего проекта
        setDialogFocuses(new Map());

        if (!projectId) {
            return;
        }

        // Фильтруем свой manager_id — чтобы не показывать "вы отвечаете" самому себе
        const myManagerId = getManagerId();

        getDialogFocuses(projectId).then(res => {
            if (res.success && res.focuses) {
                const map = new Map<number, ManagerFocusInfo[]>();
                for (const [uid, managers] of Object.entries(res.focuses)) {
                    // Исключаем себя из списка менеджеров
                    const otherManagers = managers
                        .filter(m => m.manager_id !== myManagerId)
                        .map(m => ({
                            managerId: m.manager_id,
                            managerName: m.manager_name,
                        }));
                    if (otherManagers.length > 0) {
                        map.set(Number(uid), otherManagers);
                    }
                }
                msgLog('DIALOG_FOCUS', `Загружены начальные фокусы: ${map.size} диалогов с менеджерами (свой ${myManagerId} отфильтрован)`, Object.fromEntries(map));
                setDialogFocuses(map);
            }
        }).catch(err => {
            msgWarn('DIALOG_FOCUS', `Ошибка загрузки dialog-focuses для ${fmtProject(projectId)}`, err);
        });
    }, [projectId]);

    // Очистка таймеров при размонтировании
    useEffect(() => {
        return () => {
            typingTimersRef.current.forEach(timer => clearTimeout(timer));
            typingTimersRef.current.clear();
        };
    }, []);

    return {
        typingUsers,
        dialogFocuses,
        handleUserTyping,
        handleDialogFocus,
    };
}
