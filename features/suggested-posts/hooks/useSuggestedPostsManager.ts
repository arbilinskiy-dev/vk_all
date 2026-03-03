
import { useState, useCallback } from 'react';
import { Project, SuggestedPost } from '../../../shared/types';
import { useSuggestedPosts } from './useSuggestedPosts';
import * as api from '../../../services/api';

/** Результат массовой коррекции: маппинг id поста → исправленный текст */
export type BulkResults = Record<string, string>;

interface UseSuggestedPostsManagerProps {
    project: Project;
    cachedPosts: SuggestedPost[] | undefined;
    onPostsLoaded: (posts: SuggestedPost[]) => void;
}

export const useSuggestedPostsManager = ({
    project,
    cachedPosts,
    onPostsLoaded,
}: UseSuggestedPostsManagerProps) => {
    const { posts, isLoading, error, handleRefresh } = useSuggestedPosts({
        project,
        cachedPosts,
        onPostsLoaded,
    });

    const [selectedPost, setSelectedPost] = useState<SuggestedPost | null>(null);
    const [correctedText, setCorrectedText] = useState<string>('');
    const [isCorrecting, setIsCorrecting] = useState<boolean>(false);

    // Состояние массовой коррекции
    const [bulkResults, setBulkResults] = useState<BulkResults>({});
    const [isBulkCorrecting, setIsBulkCorrecting] = useState<boolean>(false);

    const [confirmation, setConfirmation] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const executeCorrection = useCallback(async (post: SuggestedPost) => {
        setSelectedPost(post);
        setCorrectedText(''); 
        setIsCorrecting(true);
        // Очищаем массовые результаты при одиночной коррекции
        setBulkResults({});
        try {
            const result = await api.correctSuggestedPostText(post.text, project.id);
            setCorrectedText(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось выполнить коррекцию текста.';
            console.error(err);
            setCorrectedText(`Ошибка AI: ${errorMessage}`);
        } finally {
            setIsCorrecting(false);
        }
    }, [project.id]);

    /** Массовая коррекция всех постов одним запросом к AI */
    const executeBulkCorrection = useCallback(async () => {
        if (isBulkCorrecting || isCorrecting || posts.length === 0) return;

        // Очищаем одиночную коррекцию
        setSelectedPost(null);
        setCorrectedText('');
        setBulkResults({});
        setIsBulkCorrecting(true);

        try {
            const postsPayload = posts.map(p => ({ id: p.id, text: p.text }));
            const results = await api.bulkCorrectSuggestedPosts(project.id, postsPayload);

            // Преобразуем массив [{id, correctedText}] в Record<id, correctedText>
            const resultsMap: BulkResults = {};
            for (const item of results) {
                resultsMap[item.id] = item.correctedText;
            }
            setBulkResults(resultsMap);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось выполнить массовую коррекцию.';
            console.error(err);
            // При ошибке записываем сообщение об ошибке для всех постов
            const errorMap: BulkResults = {};
            for (const post of posts) {
                errorMap[post.id] = `Ошибка AI: ${errorMessage}`;
            }
            setBulkResults(errorMap);
        } finally {
            setIsBulkCorrecting(false);
        }
    }, [isBulkCorrecting, isCorrecting, posts, project.id]);

    /** Обработчик кнопки "Отредактировать все" с подтверждением при наличии результатов */
    const handleBulkCorrection = useCallback(() => {
        if (isBulkCorrecting || isCorrecting) return;

        const hasAnyResults = Object.keys(bulkResults).length > 0 || correctedText;
        if (hasAnyResults) {
            setConfirmation({
                title: 'Отредактировать все?',
                message: 'Все текущие результаты AI-редактирования будут заменены. Продолжить?',
                onConfirm: () => {
                    setConfirmation(null);
                    executeBulkCorrection();
                },
            });
        } else {
            executeBulkCorrection();
        }
    }, [isBulkCorrecting, isCorrecting, bulkResults, correctedText, executeBulkCorrection]);

    /** Обновляет отредактированный текст для конкретного поста в массовых результатах */
    const handleUpdateBulkText = useCallback((postId: string, newText: string) => {
        setBulkResults(prev => ({ ...prev, [postId]: newText }));
    }, []);

    const handleSelectPost = useCallback(async (post: SuggestedPost) => {
        if (isCorrecting || isBulkCorrecting) return;

        if (correctedText) {
            if (selectedPost?.id === post.id) {
                setConfirmation({
                    title: 'Подтвердите действие',
                    message: 'Вы точно хотите сгенерировать новый текст? Старый будет удален безвозвратно.',
                    onConfirm: () => {
                        setConfirmation(null);
                        executeCorrection(post);
                    },
                });
            } else {
                setConfirmation({
                    title: 'Начать новую генерацию?',
                    message: 'Закрыть результат прошлой генерации и начать новую? Старый будет удален безвозвратно.',
                    onConfirm: () => {
                        setConfirmation(null);
                        executeCorrection(post);
                    }
                });
            }
        } else {
            executeCorrection(post);
        }
    }, [isCorrecting, isBulkCorrecting, correctedText, selectedPost, executeCorrection]);

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleCancelConfirmation = () => {
        setConfirmation(null);
    };
    
    return {
        state: {
            posts,
            isLoading,
            error,
            selectedPost,
            correctedText,
            isCorrecting,
            confirmation,
            bulkResults,
            isBulkCorrecting,
        },
        actions: {
            handleRefresh,
            handleSelectPost,
            handleCopyToClipboard,
            handleCancelConfirmation,
            handleBulkCorrection,
            handleUpdateBulkText,
        },
    };
};
