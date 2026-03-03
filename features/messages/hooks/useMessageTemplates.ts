/**
 * Хук для управления шаблонами ответов сообщений.
 * CRUD + состояние + предпросмотр.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    MessageTemplate,
    MessageTemplateCreate,
    MessageTemplateUpdate,
    getMessageTemplates,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    previewMessageTemplate,
} from '../../../services/api/message_template.api';

interface UseMessageTemplatesParams {
    projectId: string | null;
}

export function useMessageTemplates({ projectId }: UseMessageTemplatesParams) {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Предотвращаем загрузку данных для старого проекта
    const currentProjectIdRef = useRef(projectId);
    currentProjectIdRef.current = projectId;

    // --- Загрузка шаблонов ---
    const loadTemplates = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMessageTemplates(projectId);
            // Проверяем что проект не сменился за время загрузки
            if (currentProjectIdRef.current === projectId) {
                setTemplates(data);
            }
        } catch (err) {
            console.error('[useMessageTemplates] Ошибка загрузки:', err);
            if (currentProjectIdRef.current === projectId) {
                setError('Не удалось загрузить шаблоны');
            }
        } finally {
            if (currentProjectIdRef.current === projectId) {
                setIsLoading(false);
            }
        }
    }, [projectId]);

    // Загрузка при смене проекта
    useEffect(() => {
        if (projectId) {
            loadTemplates();
        } else {
            setTemplates([]);
        }
    }, [projectId, loadTemplates]);

    // --- Создание шаблона ---
    const create = useCallback(async (data: MessageTemplateCreate): Promise<MessageTemplate | null> => {
        if (!projectId) return null;
        setIsSaving(true);
        try {
            const newTemplate = await createMessageTemplate(projectId, data);
            setTemplates(prev => [...prev, newTemplate]);
            return newTemplate;
        } catch (err) {
            console.error('[useMessageTemplates] Ошибка создания:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [projectId]);

    // --- Обновление шаблона ---
    const update = useCallback(async (templateId: string, data: MessageTemplateUpdate): Promise<MessageTemplate | null> => {
        setIsSaving(true);
        try {
            const updated = await updateMessageTemplate(templateId, data);
            setTemplates(prev => prev.map(t => t.id === templateId ? updated : t));
            return updated;
        } catch (err) {
            console.error('[useMessageTemplates] Ошибка обновления:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, []);

    // --- Удаление шаблона ---
    const remove = useCallback(async (templateId: string): Promise<boolean> => {
        try {
            await deleteMessageTemplate(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            return true;
        } catch (err) {
            console.error('[useMessageTemplates] Ошибка удаления:', err);
            throw err;
        }
    }, []);

    // --- Предпросмотр ---
    const preview = useCallback(async (text: string, userId?: number): Promise<string> => {
        if (!projectId) return text;
        try {
            const result = await previewMessageTemplate(projectId, text, userId);
            return result.preview_text;
        } catch (err) {
            console.error('[useMessageTemplates] Ошибка предпросмотра:', err);
            return text;
        }
    }, [projectId]);

    return {
        templates,
        isLoading,
        error,
        isSaving,
        create,
        update,
        remove,
        preview,
        reload: loadTemplates,
    };
}
