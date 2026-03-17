// PostPreview — компонент предпросмотра поста в стиле VK.
// Показывает как пост будет выглядеть после публикации.
// Обновляется в реальном времени по мере ввода текста и добавления медиа.

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Attachment, GlobalVariableDefinition, ProjectGlobalVariableValue, PollData } from '../../../../shared/types';
import { renderVkFormattedText } from '../../../../shared/utils/renderVkFormattedText';

// Lightbox — полноэкранный просмотр с навигацией по всем изображениям
const ImageLightbox: React.FC<{
    images: { id: string; url: string }[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}> = ({ images, currentIndex, onClose, onNavigate }) => {
    // Навигация стрелками и закрытие по Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
            if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose, onNavigate, currentIndex, images.length]);

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] cursor-zoom-out animate-fade-in"
            onClick={onClose}
        >
            {/* Кнопка закрытия */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-gray-800/75 text-white rounded-full p-2 hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
                title="Закрыть"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Стрелка влево */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800/75 text-white rounded-full p-2 hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
                    title="Предыдущее"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Стрелка вправо */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800/75 text-white rounded-full p-2 hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
                    title="Следующее"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Изображение */}
            <img
                src={images[currentIndex].url}
                alt=""
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-default animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            />

            {/* Счётчик */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/75 text-white text-sm px-3 py-1 rounded-full">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>,
        document.body
    );
};

// Вспомогательный компонент: изображение со скелетоном и плавным появлением
const ImageWithSkeleton: React.FC<{ src: string; alt: string; className?: string; skeletonClassName?: string }> = ({ src, alt, className = '', skeletonClassName = '' }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <>
            {!isLoaded && <div className={`absolute inset-0 bg-gray-200 animate-pulse ${skeletonClassName}`} />}
            <img
                src={src}
                alt={alt}
                className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
            />
        </>
    );
};

// Компонент предпросмотра опроса в стиле VK
const PollPreview: React.FC<{ pollData: PollData; description?: string }> = ({ pollData, description }) => {
    const question = pollData?.question || description || 'Опрос';
    const answers = pollData?.answers?.filter(a => a.trim()) || [];
    
    return (
        <div className="mx-3 mb-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Заголовок опроса */}
            <div className="px-3 py-2.5 bg-purple-50/70">
                <div className="flex items-center gap-1.5 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-purple-700 truncate">{question}</span>
                </div>
                {/* Бейджи */}
                <div className="flex gap-2">
                    {pollData?.is_anonymous && (
                        <span className="text-[10px] text-gray-400">Анонимный</span>
                    )}
                    {pollData?.is_multiple && (
                        <span className="text-[10px] text-gray-400">Несколько ответов</span>
                    )}
                </div>
            </div>
            
            {/* Варианты ответов */}
            {answers.length > 0 ? (
                <div className="px-3 py-2 space-y-1.5">
                    {answers.map((answer, idx) => (
                        <div key={idx} className="relative bg-gray-50 rounded-md px-3 py-1.5 text-xs text-gray-700 border border-gray-100">
                            {answer}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-3 py-2">
                    <p className="text-[10px] text-gray-400 italic">Варианты ответов не заполнены</p>
                </div>
            )}
        </div>
    );
};

interface PostPreviewProps {
    /** Текст поста */
    text: string;
    /** JSON-строка с изображениями [{id, url}] */
    images: string;
    /** Вложения (документы, аудио и т.д.) */
    attachments: Attachment[];
    /** Слот даты-времени публикации */
    dateSlot?: { date: string; time: string };
    /** Название проекта/сообщества */
    projectName?: string;
    /** URL аватарки сообщества */
    projectAvatar?: string;
    /** Закреплён ли пост */
    isPinned?: boolean;
    /** Определения глобальных переменных */
    globalVariables?: GlobalVariableDefinition[] | null;
    /** Значения глобальных переменных для текущего проекта */
    globalVariableValues?: ProjectGlobalVariableValue[];
    /** Текст первого комментария (для превью) */
    firstCommentText?: string;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
    text, images, attachments, dateSlot, projectName, projectAvatar, isPinned, globalVariables, globalVariableValues, firstCommentText
}) => {
    // Парсинг изображений
    const parsedImages = useMemo(() => {
        try {
            if (!images) return [];
            const parsed = typeof images === 'string' ? JSON.parse(images) : images;
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    }, [images]);

    // Подстановка значений глобальных переменных в текст
    const resolvedText = useMemo(() => {
        if (!text || !globalVariables?.length || !globalVariableValues?.length) return text;
        
        let result = text;
        for (const def of globalVariables) {
            const placeholder = `{global_${def.placeholder_key}}`;
            if (result.includes(placeholder)) {
                const valueObj = globalVariableValues.find(v => v.definition_id === def.id);
                if (valueObj?.value) {
                    result = result.replaceAll(placeholder, valueObj.value);
                }
            }
        }
        return result;
    }, [text, globalVariables, globalVariableValues]);

    // Форматирование даты
    const dateStr = useMemo(() => {
        if (!dateSlot?.date || !dateSlot?.time) return 'Дата не указана';
        try {
            const d = new Date(`${dateSlot.date}T${dateSlot.time}`);
            return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} в ${dateSlot.time}`;
        } catch { return 'Дата не указана'; }
    }, [dateSlot]);

    // Lightbox — индекс открытого изображения (null = закрыт)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const closeLightbox = useCallback(() => setLightboxIndex(null), []);
    const navigateLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);

    // Состояние контента
    const hasContent = text || parsedImages.length > 0 || attachments.length > 0;

    return (
        <div className="space-y-3">
            {/* Карточка в стиле VK */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Шапка поста */}
                <div className="flex items-center gap-3 p-3">
                    {/* Аватарка сообщества — реальная или заглушка */}
                    {projectAvatar ? (
                        <div className="relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                            <ImageWithSkeleton
                                src={projectAvatar}
                                alt={projectName || 'Сообщество'}
                                className="w-10 h-10 rounded-full object-cover"
                                skeletonClassName="rounded-full"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{projectName || 'Сообщество'}</p>
                        <p className="text-xs text-gray-500">{dateStr}</p>
                    </div>
                </div>

                {/* Текст */}
                <div className="px-3 pb-2">
                    {resolvedText ? (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{renderVkFormattedText(resolvedText)}</p>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Текст не введён...</p>
                    )}
                </div>

                {/* Изображения */}
                {parsedImages.length > 0 && (
                    <div className="mt-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                        {parsedImages.length === 1 ? (
                            <button
                                type="button"
                                className="aspect-square relative w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onClick={() => setLightboxIndex(0)}
                            >
                                <ImageWithSkeleton src={parsedImages[0].url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ) : (
                            <div className={`grid gap-0.5 ${
                                parsedImages.length === 2 ? 'grid-cols-2' : 
                                parsedImages.length === 3 ? 'grid-cols-3' : 
                                'grid-cols-2'
                            }`}>
                                {parsedImages.slice(0, 4).map((img: { id: string; url: string }, idx: number) => (
                                    <button
                                        type="button"
                                        key={img.id || idx}
                                        className="relative aspect-square overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                        onClick={() => setLightboxIndex(idx)}
                                    >
                                        <ImageWithSkeleton src={img.url} alt="" className="w-full h-full object-cover" />
                                        {idx === 3 && parsedImages.length > 4 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-lg font-bold">+{parsedImages.length - 4}</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Опрос — отдельный блок в стиле VK */}
                {attachments.filter(a => a.type === 'poll').map((att, idx) => (
                    <PollPreview 
                        key={`poll-${idx}`}
                        pollData={att.poll_data!}
                        description={att.description}
                    />
                ))}

                {/* Вложения (без опросов — они рендерятся выше) */}
                {attachments.filter(a => a.type !== 'poll').length > 0 && (
                    <div className="px-3 py-2 space-y-1.5 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        {attachments.filter(a => a.type !== 'poll').map((att, idx) => (
                            att.type === 'video' ? (
                                /* Видео-вложение с превью на всю ширину */
                                <div key={idx} className="rounded-lg overflow-hidden bg-gray-50">
                                    {att.thumbnail_url ? (
                                        <div className="relative w-full aspect-video bg-black">
                                            <ImageWithSkeleton src={att.thumbnail_url} alt={att.description || 'Видео'} className="w-full h-full object-cover" />
                                            {/* Иконка Play по центру */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {/* Название видео внизу */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                                                <p className="text-xs text-white truncate">{att.description}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Заглушка если превью нет */
                                        <div className="relative w-full aspect-video bg-gray-200 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <p className="absolute bottom-2 left-3 text-xs text-gray-500">{att.description || 'Видео'}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Обычное вложение (док, аудио, ссылка и т.д.) */
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-md px-2.5 py-1.5">
                                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span className="truncate">{att.description || att.id || 'Вложение'}</span>
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Футер в стиле VK — лайки, комменты, шеры */}
                <div className="flex items-center gap-6 px-3 py-2.5 border-t border-gray-100">
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors" disabled>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors" disabled>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 transition-colors" disabled>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Превью первого комментария */}
            {firstCommentText && firstCommentText.trim() && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden -mt-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    <div className="px-3 py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-400">Первый комментарий</span>
                    </div>
                    <div className="flex gap-2.5 p-3">
                        {/* Аватарка сообщества */}
                        {projectAvatar ? (
                            <div className="relative w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                                <ImageWithSkeleton
                                    src={projectAvatar}
                                    alt={projectName || 'Сообщество'}
                                    className="w-8 h-8 rounded-full object-cover"
                                    skeletonClassName="rounded-full"
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-900">{projectName || 'Сообщество'}</span>
                                <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded">Автор</span>
                            </div>
                            <p className="text-xs text-gray-800 whitespace-pre-wrap break-words mt-0.5 leading-relaxed">{renderVkFormattedText(firstCommentText.trim())}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-gray-400">только что</span>
                                <span className="text-[10px] text-gray-400 cursor-default">Ответить</span>
                                <span className="text-[10px] text-gray-400 cursor-default">Поделиться</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox для просмотра всех изображений */}
            {lightboxIndex !== null && parsedImages.length > 0 && (
                <ImageLightbox
                    images={parsedImages}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onNavigate={navigateLightbox}
                />
            )}

            {/* Подсказка если пусто */}
            {!hasContent && (
                <div className="text-center py-6 text-gray-400 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-xs">Начните вводить текст или добавьте медиа<br/>для предпросмотра</p>
                </div>
            )}
        </div>
    );
};
