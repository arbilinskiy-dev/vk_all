/**
 * Список видео из переписки.
 */
import React, { useState } from 'react';
import { AttachmentItem } from '../../hooks/chat/useConversationAttachments';
import { formatAttachmentDate, formatDuration } from './attachmentsUtils';
import { EmptyCategory } from './EmptyCategory';

interface VideosListProps {
    items: AttachmentItem[];
}

export const VideosList: React.FC<VideosListProps> = ({ items }) => {
    // Трекинг загрузки превью для skeleton + fade-in
    const [loadedSet, setLoadedSet] = useState<Set<string>>(() => new Set());
    const onImageLoad = (key: string) => {
        setLoadedSet(prev => { const next = new Set(prev); next.add(key); return next; });
    };

    if (items.length === 0) return <EmptyCategory text="Видео нет" />;

    return (
        <div className="space-y-2 p-3">
            {items.map((item, idx) => (
                <div
                    key={`${item.messageId}-${idx}`}
                    className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors opacity-0 animate-fade-in-row"
                    style={{ animationDelay: `${idx * 25}ms` }}
                >
                    {/* Превью видео */}
                    <div className="w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 relative">
                        {item.previewUrl ? (
                            <>
                                {/* Скелетон пока превью грузится */}
                                {!loadedSet.has(`${item.messageId}-${idx}`) && (
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                )}
                                <img
                                    src={item.previewUrl}
                                    alt={item.name || 'Видео'}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${loadedSet.has(`${item.messageId}-${idx}`) ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => onImageLoad(`${item.messageId}-${idx}`)}
                                    loading="lazy"
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        {/* Длительность */}
                        {item.duration && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                                {formatDuration(item.duration)}
                            </span>
                        )}
                    </div>
                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{item.name || 'Видео'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatAttachmentDate(item.messageDate)}
                            {item.direction === 'incoming' ? ' · от клиента' : ' · от нас'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
