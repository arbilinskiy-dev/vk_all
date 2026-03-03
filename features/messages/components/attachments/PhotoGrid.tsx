/**
 * Сетка фотографий сообщения.
 * 1 фото — одно изображение.
 * 2-4 фото — сетка (все видны).
 * 5+ фото — сетка 2x2: 3 превью + ячейка «+X» с размытым фоном.
 * Клик на любую ячейку → полноэкранный просмотр с навигацией.
 */
import React, { useState } from 'react';
import { MessageAttachment } from '../../types';
import { PhotoLightbox } from './PhotoLightbox';

interface PhotoGridProps {
    photos: MessageAttachment[];
    isOutgoing: boolean;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, isOutgoing }) => {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [loadedSet, setLoadedSet] = useState<Set<number>>(() => new Set());

    const onImageLoad = (idx: number) => {
        setLoadedSet(prev => {
            const next = new Set(prev);
            next.add(idx);
            return next;
        });
    };

    const totalCount = photos.length;
    const showGrid = totalCount > 1;
    const showOverflow = totalCount > 4;
    // Количество ячеек в сетке: макс 4, при overflow — 3 превью + 1 «+X»
    const visibleCount = showOverflow ? 3 : totalCount;
    const overflowCount = totalCount - 3; // показываем «+N»

    // Одно фото — просто изображение с кликом
    if (totalCount === 1) {
        return (
            <>
                <button onClick={() => setLightboxIndex(0)} className="block rounded-md overflow-hidden cursor-pointer w-full relative">
                    {!loadedSet.has(0) && <div className="w-full h-[180px] bg-gray-200 animate-pulse rounded-md" />}
                    <img
                        src={photos[0].previewUrl || photos[0].url}
                        alt="Фото"
                        className={`rounded-md w-full transition-opacity duration-300 ${loadedSet.has(0) ? 'opacity-100' : 'opacity-0 h-0'}`}
                        onLoad={() => onImageLoad(0)}
                    />
                </button>
                {lightboxIndex !== null && (
                    <PhotoLightbox
                        photos={photos}
                        currentIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                        onNavigate={setLightboxIndex}
                    />
                )}
            </>
        );
    }

    // Сетка 2x2 
    return (
        <>
            <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden w-full">
                {/* Превью-ячейки */}
                {photos.slice(0, visibleCount).map((photo, idx) => (
                    <button
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="relative aspect-square overflow-hidden cursor-pointer bg-gray-200"
                    >
                        {!loadedSet.has(idx) && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                        )}
                        <img
                            src={photo.previewUrl || photo.url}
                            alt="Фото"
                            className={`w-full h-full object-cover transition-opacity duration-300 ${loadedSet.has(idx) ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => onImageLoad(idx)}
                        />
                    </button>
                ))}

                {/* Ячейка «+X» — оставшиеся фотографии */}
                {showOverflow && (
                    <button
                        onClick={() => setLightboxIndex(3)}
                        className="relative aspect-square overflow-hidden cursor-pointer bg-gray-300"
                    >
                        {/* Размытое превью четвёртого фото */}
                        <img
                            src={photos[3].previewUrl || photos[3].url}
                            alt=""
                            className="w-full h-full object-cover blur-sm scale-110"
                        />
                        {/* Оверлей со счётчиком */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">+{overflowCount}</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Лайтбокс с навигацией */}
            {lightboxIndex !== null && (
                <PhotoLightbox
                    photos={photos}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </>
    );
};
