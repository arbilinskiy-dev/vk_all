import React, { useState } from 'react';
import { MarketItem } from '../../../../shared/types';

/**
 * @fileoverview Компонент для отображения ячейки с текущей фотографией товара.
 * Показывает пульсирующий скелетон пока изображение загружается,
 * затем плавно проявляет фото через transition-opacity.
 */
export const PhotoCell: React.FC<{
    item: MarketItem;
    onPreviewImage: (item: MarketItem) => void;
}> = ({ item, onPreviewImage }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <button
            onClick={() => onPreviewImage(item)}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded h-14 w-14 relative"
        >
            {/* Скелетон-плейсхолдер — виден пока фото не загрузилось */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded animate-pulse" />
            )}
            {/* Фото с плавным появлением */}
            <img
                src={item.thumb_photo}
                alt={item.title}
                className={`h-14 w-14 object-cover rounded transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
            />
        </button>
    );
};
