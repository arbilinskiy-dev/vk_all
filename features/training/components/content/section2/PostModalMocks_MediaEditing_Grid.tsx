import React, { useState } from 'react';

// =====================================================================
// Компоненты сеток и отображения медиа
// =====================================================================

// Mock: Сетка изображений с управлением
export const MockMediaGrid: React.FC = () => {
    const [images, setImages] = useState([
        { id: 1, url: 'https://picsum.photos/seed/media-1/200/200' },
        { id: 2, url: 'https://picsum.photos/seed/media-2/200/200' },
        { id: 3, url: 'https://picsum.photos/seed/media-3/200/200' },
        { id: 4, url: 'https://picsum.photos/seed/media-4/200/200' },
    ]);

    const handleRemove = (id: number) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleAdd = () => {
        const newId = Math.max(...images.map(img => img.id), 0) + 1;
        setImages(prev => [...prev, { 
            id: newId, 
            url: `https://picsum.photos/seed/media-${newId}/200/200` 
        }]);
    };

    return (
        <div className="space-y-4">
            <button 
                onClick={handleAdd}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
                + Добавить изображение
            </button>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {images.map((img) => (
                    <div
                        key={img.id}
                        className="relative aspect-square rounded-md overflow-hidden border-2 border-gray-200 hover:border-indigo-400 cursor-pointer group"
                    >
                        <img
                            src={img.url}
                            alt={`Изображение ${img.id}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => handleRemove(img.id)}
                            className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            {images.length === 0 && (
                <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-md text-center">
                    Изображения не добавлены
                </div>
            )}
        </div>
    );
};

// Mock: Компактный режим с оверлеем
export const MockCompactMode: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const images = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        url: `https://picsum.photos/seed/compact-${i}/200/200`,
    }));

    const visibleImages = isExpanded ? images : images.slice(0, 4);
    const hiddenCount = images.length - 3;

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {visibleImages.map((img, index) => {
                    const isOverlay = !isExpanded && index === 3;
                    return (
                        <div key={img.id} className="relative aspect-square">
                            <img
                                src={img.url}
                                alt={`Изображение ${img.id}`}
                                className="w-full h-full object-cover rounded"
                            />
                            {isOverlay && (
                                <div 
                                    onClick={() => setIsExpanded(true)}
                                    className="absolute inset-0 bg-black/60 rounded flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:bg-black/50 transition-colors backdrop-blur-[1px]"
                                >
                                    +{hiddenCount}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isExpanded && (
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1 ml-auto"
                >
                    Свернуть
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
};

// Mock: Переключатель размера сетки (3×3 / 4×4 / 5×5)
export const MockGridSizeSwitch: React.FC = () => {
    const [gridSize, setGridSize] = useState(3);

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Размер сетки:</span>
            <div className="flex items-center p-0.5 bg-gray-200 rounded-md">
                {[3, 4, 5].map(size => (
                    <button 
                        key={size} 
                        onClick={() => setGridSize(size)} 
                        title={`Сетка ${size}×${size}`}
                        className={`p-2 rounded transition-colors ${gridSize === size ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            {Array.from({length: size * size}).map((_, i) => {
                                const col = i % size;
                                const row = Math.floor(i / size);
                                const s = 16 / size;
                                const gap = s > 4 ? 1.5 : 1;
                                return (
                                    <rect 
                                        key={i} 
                                        x={col * s + gap/2} 
                                        y={row * s + gap/2} 
                                        width={s - gap} 
                                        height={s - gap} 
                                        rx="1"
                                    />
                                );
                            })}
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};
