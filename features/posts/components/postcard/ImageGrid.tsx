import React from 'react';
import { ScheduledPost } from '../../../../shared/types';
import { LazyImage } from '../../../../shared/components/LazyImage';

/**
 * Превью изображений поста в сетке 2×2.
 * Показываем до 3 картинок, в 4-й ячейке — "+N" (сколько ещё вложений).
 */
const MAX_VISIBLE = 3;

export const ImageGrid: React.FC<{ images: ScheduledPost['images'] }> = React.memo(({ images }) => {
    if (images.length === 0) return null;

    const visibleImages = images.slice(0, MAX_VISIBLE);
    const remainingCount = images.length - MAX_VISIBLE;

    return (
        <div className="grid grid-cols-2 gap-1.5 mt-2 mb-1">
            {visibleImages.map((img, idx) => (
                <div
                    key={img.id}
                    className="aspect-square rounded-md overflow-hidden bg-gray-100"
                >
                    <LazyImage
                        src={img.url}
                        alt={`Фото ${idx + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
            {remainingCount > 0 && (
                <div className="aspect-square rounded-md bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-500">+{remainingCount}</span>
                </div>
            )}
        </div>
    );
});