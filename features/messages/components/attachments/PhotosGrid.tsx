/**
 * Сетка фотографий — с skeleton + fade-in + скачивание.
 */
import React, { useState } from 'react';
import { AttachmentItem } from '../../hooks/chat/useConversationAttachments';
import { formatAttachmentDate, downloadPhoto } from './attachmentsUtils';
import { EmptyCategory } from './EmptyCategory';

interface PhotosGridProps {
    items: AttachmentItem[];
    onPreview: (url: string) => void;
}

export const PhotosGrid: React.FC<PhotosGridProps> = ({ items, onPreview }) => {
    const [loadedSet, setLoadedSet] = useState<Set<string>>(() => new Set());

    const onImageLoad = (key: string) => {
        setLoadedSet(prev => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    };

    if (items.length === 0) return <EmptyCategory text="Фотографий нет" />;

    return (
        <div className="grid grid-cols-3 gap-1.5 p-3">
            {items.map((item, idx) => {
                const key = `${item.messageId}-${idx}`;
                const isLoaded = loadedSet.has(key);
                return (
                    <div
                        key={key}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group cursor-pointer opacity-0 animate-fade-in-row"
                        style={{ animationDelay: `${idx * 30}ms` }}
                        onClick={() => onPreview(item.url)}
                    >
                        {/* Скелетон пока фото грузится */}
                        {!isLoaded && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                        )}
                        <img
                            src={item.previewUrl || item.url}
                            alt={item.name || 'Фото'}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => onImageLoad(key)}
                            loading="lazy"
                        />
                        {/* Оверлей при наведении */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        {/* Кнопка скачивания */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadPhoto(item.url, item.name || `photo_${item.messageId}_${idx}.jpg`);
                            }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Скачать фото"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        {/* Дата при наведении */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatAttachmentDate(item.messageDate)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
