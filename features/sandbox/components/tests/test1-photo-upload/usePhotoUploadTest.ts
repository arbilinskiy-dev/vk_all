/**
 * Хук логики для Теста 1: Загрузка фото + публикация истории (Story).
 * 
 * Полностью изолирован от основной логики приложения.
 * User Token — для загрузки фото (stories.getPhotoUploadServer).
 * Community Token — для публикации истории (stories.save).
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Типы ───────────────────────────────────────────────

/** Лог одного шага VK API */
export interface StepLog {
    step: number;
    name: string;
    description: string;
    success: boolean;
    request: Record<string, any>;
    response: Record<string, any> | null;
    http_status: number | null;
    elapsed_ms: number;
    error: Record<string, any> | null;
}

/** Результат выполнения теста */
export interface TestResult {
    overall_success: boolean;
    failed_at_step: number | null;
    steps: StepLog[];
    result: {
        story_id?: number;
        owner_id?: number;
        story_url?: string;
        upload_result?: string;
        raw_response?: any;
    } | null;
    error?: string;
}

/** Режим работы теста */
export type TestMode = 'upload-and-publish' | 'upload-only';

/** Состояние хука */
interface UsePhotoUploadTestState {
    /** Токен сообщества (для публикации истории) */
    communityToken: string;
    /** Токен пользователя (для загрузки фото) */
    userToken: string;
    /** ID группы (без минуса) */
    groupId: string;
    /** Текст поста */
    postText: string;
    /** Выбранный файл */
    selectedFile: File | null;
    /** Превью файла */
    filePreview: string | null;
    /** Режим теста */
    mode: TestMode;
    /** Загрузка в процессе */
    isLoading: boolean;
    /** Результат теста */
    result: TestResult | null;
    /** Ошибка запроса */
    requestError: string | null;
}

export function usePhotoUploadTest() {
    const [communityToken, setCommunityToken] = useState('');
    const [userToken, setUserToken] = useState('');
    const [groupId, setGroupId] = useState('');
    const [postText, setPostText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [mode, setMode] = useState<TestMode>('upload-and-publish');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);

    /** Обработка выбора файла */
    const handleFileSelect = useCallback((file: File | null) => {
        setSelectedFile(file);
        setResult(null);
        setRequestError(null);
        
        // Создаём превью
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
        }
        
        if (file) {
            const preview = URL.createObjectURL(file);
            setFilePreview(preview);
        } else {
            setFilePreview(null);
        }
    }, [filePreview]);

    /** Запуск теста */
    const runTest = useCallback(async () => {
        // Валидация
        if (!communityToken.trim()) {
            setRequestError('Введите токен сообщества');
            return;
        }
        if (!userToken.trim()) {
            setRequestError('Введите токен пользователя');
            return;
        }
        if (!groupId.trim() || isNaN(Number(groupId))) {
            setRequestError('Введите корректный ID группы (число без минуса)');
            return;
        }
        if (!selectedFile) {
            setRequestError('Выберите файл для загрузки');
            return;
        }

        setIsLoading(true);
        setResult(null);
        setRequestError(null);

        try {
            const formData = new FormData();
            formData.append('photo', selectedFile);
            formData.append('group_id', groupId.trim());
            formData.append('community_token', communityToken.trim());
            formData.append('user_token', userToken.trim());

            const endpoint = mode === 'upload-and-publish' 
                ? 'sandbox/test1/upload-story' 
                : 'sandbox/test1/upload-only';

            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data: TestResult = await response.json();
            setResult(data);

        } catch (error: any) {
            setRequestError(error.message || 'Неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    }, [communityToken, userToken, groupId, selectedFile, mode]);

    /** Сброс результатов */
    const resetResults = useCallback(() => {
        setResult(null);
        setRequestError(null);
    }, []);

    /** Полный сброс */
    const resetAll = useCallback(() => {
        setCommunityToken('');
        setUserToken('');
        setGroupId('');
        setPostText('');
        setSelectedFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
        }
        setFilePreview(null);
        setMode('upload-and-publish');
        setIsLoading(false);
        setResult(null);
        setRequestError(null);
    }, [filePreview]);

    return {
        // Состояние
        communityToken,
        userToken,
        groupId,
        postText,
        selectedFile,
        filePreview,
        mode,
        isLoading,
        result,
        requestError,
        // Действия
        setCommunityToken,
        setUserToken,
        setGroupId,
        setPostText,
        setMode,
        handleFileSelect,
        runTest,
        resetResults,
        resetAll,
    };
}
