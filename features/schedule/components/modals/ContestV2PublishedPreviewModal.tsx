import React from 'react';
import { ScheduledPost } from '../../../../shared/types';
import { ImageGrid } from '../../../posts/components/postcard/ImageGrid';

interface ContestV2PublishedPreviewModalProps {
    post: ScheduledPost;
    onClose: () => void;
    onNavigateToSettings: () => void;
}

/**
 * Модалка для просмотра опубликованного поста Конкурс 2.0.
 * Показывает информацию о посте и направляет пользователя в настройки конкурса.
 * Редактирование и удаление запрещены — пост связан с активным конкурсом.
 */
export const ContestV2PublishedPreviewModal: React.FC<ContestV2PublishedPreviewModalProps> = ({ 
    post, 
    onClose, 
    onNavigateToSettings 
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Заголовок — изумрудный стиль для Конкурс 2.0 */}
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0 bg-emerald-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Пост конкурса 2.0</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Закрыть">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <main className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    <div className="space-y-4">
                        {/* Информационный блок */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                            <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-medium">Этот пост связан с активным конкурсом</p>
                                    <p className="text-emerald-600 mt-1">
                                        Редактирование и удаление недоступны. Для изменения настроек перейдите в раздел "Конкурс 2.0".
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Контент поста */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap mb-4">{post.text}</p>
                            
                            {post.images && post.images.length > 0 && (
                                <ImageGrid images={post.images} />
                            )}
                        </div>

                        {/* Дата публикации */}
                        <div className="text-xs text-gray-400">
                            Опубликовано: {new Date(post.date).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}
                        </div>

                        {/* Ссылка на VK */}
                        {post.vkPostUrl && (
                            <a 
                                href={post.vkPostUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Посмотреть в VK
                            </a>
                        )}
                    </div>
                </main>

                <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Закрыть
                    </button>
                    <button 
                        onClick={onNavigateToSettings} 
                        className="px-4 py-2 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Перейти к настройкам
                    </button>
                </footer>
            </div>
        </div>
    );
};
