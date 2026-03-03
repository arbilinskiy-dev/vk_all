import React from 'react';
import { ScheduledPost } from '../../../../shared/types';
import { LazyImage } from '../../../../shared/components/LazyImage';

/**
 * Минималистичные превью-квадратики изображений поста.
 * Показываем до 5 маленьких квадратов в ряд, при большем кол-ве — "+N".
 */
const MAX_VISIBLE = 5;

export const ImageGrid: React.FC<{ images: ScheduledPost['images'] }> = React.memo(({ images }) => {
    if (images.length === 0) return null;

    const visibleImages = images.slice(0, MAX_VISIBLE);
    const remainingCount = images.length - MAX_VISIBLE;

    return (
        <div className="flex items-center gap-1.5 mt-2 mb-1">
            {visibleImages.map((img, idx) => (
                <div
                    key={img.id}
                    className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100"
                >
                    <LazyImage
                        src={img.url}
                        alt={`Фото ${idx + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
            {remainingCount > 0 && (
                <div className="w-10 h-10 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-gray-500">+{remainingCount}</span>
                </div>
            )}
        </div>
    );
});