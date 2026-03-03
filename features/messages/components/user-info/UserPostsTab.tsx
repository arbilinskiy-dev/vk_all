/**
 * Вкладка «Посты» в панели информации о пользователе (UserInfoPanel).
 * Показывает посты, которые пользователь написал в сообществе (по signer_id / post_author_id).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SystemListPost } from '../../../../shared/types';
import { ImagePreviewModal } from '../../../../shared/components/modals/ImagePreviewModal';

/** Миниатюра фото поста — маленький квадратик с skeleton + fade-in */
const PostImage: React.FC<{ src: string; onClick: () => void }> = ({ src, onClick }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="mb-2 flex items-center">
            <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 relative cursor-pointer hover:opacity-80 transition-opacity" onClick={onClick}>
                {/* Скелетон пока фото грузится */}
                {!loaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
                )}
                <img
                    src={src}
                    alt=""
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                />
            </div>
        </div>
    );
};

interface UserPostsTabProps {
    /** Посты пользователя */
    posts: SystemListPost[];
    /** Общее количество постов */
    totalCount: number;
    /** Идёт загрузка */
    isLoading: boolean;
    /** Ошибка загрузки */
    error: string | null;
    /** Есть ещё страницы */
    hasMore: boolean;
    /** Загрузить ещё */
    onLoadMore: () => void;
}

/** Форматирование даты */
function formatDate(dateInput: string | number): string {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const UserPostsTab: React.FC<UserPostsTabProps> = ({
    posts,
    totalCount,
    isLoading,
    error,
    hasMore,
    onLoadMore,
}) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Бесконечная подгрузка
    useEffect(() => {
        if (!hasMore) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }
        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [hasMore, onLoadMore]);

    // Загрузка (первичная)
    if (isLoading && posts.length === 0) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center animate-fade-in">
                <div className="loader h-6 w-6 border-2 border-gray-300 border-t-indigo-600"></div>
                <p className="text-xs text-gray-400 mt-2">Загрузка постов...</p>
            </div>
        );
    }

    // Ошибка
    if (error) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center px-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
        );
    }

    // Нет постов
    if (posts.length === 0) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center px-6 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm text-gray-400 text-center">Постов от этого пользователя не найдено</p>
                <p className="text-xs text-gray-300 mt-1 text-center">
                    Убедитесь, что список «Посты (история)» синхронизирован в разделе «Списки»
                </p>
            </div>
        );
    }

    // Рендер постов
    return (
        <div className="flex-1 h-full flex flex-col bg-white overflow-y-auto custom-scrollbar animate-fade-in">
            {/* Счётчик */}
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400">
                    Найдено постов: <span className="font-medium text-gray-600">{totalCount}</span>
                </p>
            </div>

            {/* Список постов */}
            <div className="px-4 py-2 space-y-3">
                {posts.map(post => (
                    <div
                        key={post.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                    >
                        {/* Дата + ссылка */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">
                                {formatDate(String(post.date))}
                            </span>
                            {post.vk_link && (
                                <a
                                    href={post.vk_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                    title="Открыть в VK"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    VK
                                </a>
                            )}
                        </div>

                        {/* Фото — с skeleton + fade-in */}
                        {post.image_url && (
                            <PostImage
                                src={post.image_url}
                                onClick={() => setPreviewImage(post.image_url!)}
                            />
                        )}

                        {/* Текст */}
                        {post.text ? (
                            <p className="text-sm text-gray-700 whitespace-pre-line break-words line-clamp-6">
                                {post.text}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-300 italic">Текст отсутствует</p>
                        )}

                        {/* Статистика */}
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50">
                            <span className="flex items-center gap-1 text-xs text-gray-400" title="Лайки">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {post.likes_count}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400" title="Комментарии">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                </svg>
                                {post.comments_count}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400" title="Репосты">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                {post.reposts_count}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400" title="Просмотры">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                {post.views_count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Подгрузка */}
            {hasMore && (
                <div ref={observerTarget} className="h-8 w-full flex justify-center items-center py-2">
                    {isLoading && (
                        <div className="loader h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
                    )}
                </div>
            )}

            {/* Модал превью фото */}
            {previewImage && (
                <ImagePreviewModal
                    image={{ id: 'preview', url: previewImage }}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </div>
    );
};
