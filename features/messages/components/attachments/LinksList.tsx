/**
 * Список ссылок из переписки с превью и копированием.
 */
import React, { useState } from 'react';
import { AttachmentItem } from '../../hooks/chat/useConversationAttachments';
import { copyToClipboard } from './attachmentsUtils';
import { EmptyCategory } from './EmptyCategory';

interface LinksListProps {
    items: AttachmentItem[];
}

export const LinksList: React.FC<LinksListProps> = ({ items }) => {
    // Состояние для анимации «Скопировано»
    const [copiedId, setCopiedId] = useState<string | null>(null);
    // Трекинг загрузки превью для skeleton + fade-in
    const [loadedSet, setLoadedSet] = useState<Set<string>>(() => new Set());
    const onImageLoad = (key: string) => {
        setLoadedSet(prev => { const next = new Set(prev); next.add(key); return next; });
    };

    if (items.length === 0) return <EmptyCategory text="Ссылок нет" />;

    return (
        <div className="space-y-2.5 p-3">
            {items.map((item, idx) => {
                const itemId = `${item.messageId}-${idx}`;
                return (
                    <div
                        key={itemId}
                        className="rounded-lg border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors group opacity-0 animate-fade-in-row"
                        style={{ animationDelay: `${idx * 25}ms` }}
                    >
                        {/* Превью ссылки (большой блок сверху) */}
                        {item.previewUrl && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                                <div className="w-full h-28 bg-gray-100 overflow-hidden relative">
                                    {/* Скелетон пока превью грузится */}
                                    {!loadedSet.has(itemId) && (
                                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                    )}
                                    <img
                                        src={item.previewUrl}
                                        alt={item.name || ''}
                                        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${loadedSet.has(itemId) ? 'opacity-100' : 'opacity-0'}`}
                                        onLoad={() => onImageLoad(itemId)}
                                        loading="lazy"
                                    />
                                </div>
                            </a>
                        )}
                        {/* Нижняя часть: заголовок, описание, URL + кнопка копирования */}
                        <div className="p-2.5">
                            {/* Заголовок */}
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-gray-700 hover:text-indigo-600 transition-colors line-clamp-2"
                            >
                                {item.name || item.url}
                            </a>
                            {/* Описание */}
                            {item.description && (
                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            {/* URL + кнопка копирования */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <p className="text-[10px] text-gray-400 truncate flex-1">{item.url}</p>
                                {/* Кнопка «Копировать ссылку» */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(item.url, setCopiedId, itemId);
                                    }}
                                    className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
                                    title="Копировать ссылку"
                                >
                                    {copiedId === itemId ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
