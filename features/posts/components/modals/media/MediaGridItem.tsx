
import React, { useState } from 'react';

// Компонент для отображения одного элемента сетки медиа
export const MediaGridItem: React.FC<{
    imageUrl: string;
    isEditing: boolean;
    onRemove: () => void;
    onClick?: () => void;
    onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: () => void;
    // DnD props
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ imageUrl, isEditing, onRemove, onClick, onMouseEnter, onMouseLeave, onDragStart, onDragOver, onDrop }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div
            className={`relative aspect-square group animate-fade-in-up ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            draggable={isEditing}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* Скелетон-плейсхолдер — виден пока фото не загрузилось */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded animate-pulse" />
            )}
            {/* Фото с плавным появлением */}
            <img
                src={imageUrl}
                className={`w-full h-full object-cover rounded transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                alt="media content"
                onLoad={() => setIsLoaded(true)}
            />
            
            {isEditing && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Удалить изображение"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
    );
};
