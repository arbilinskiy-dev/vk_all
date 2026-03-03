
import React from 'react';

interface GalleryToolbarProps {
    selectionCount: number;
    gridSize: number;
    isLoadingPhotos: boolean;
    onBack: () => void;
    onAddSelected: () => void;
    onGridSizeChange: (size: number) => void;
    onUploadClick: () => void;
    onRefresh: () => void;
}

export const GalleryToolbar: React.FC<GalleryToolbarProps> = ({
    selectionCount, gridSize, isLoadingPhotos,
    onBack, onAddSelected, onGridSizeChange, onUploadClick, onRefresh,
}) => {
    return (
        <div className="sticky top-0 grid grid-cols-[auto_1fr_auto] items-center p-3 border-b bg-gray-50/80 backdrop-blur-sm flex-shrink-0 z-10 gap-4">
            <div className="justify-self-start">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     Альбомы
                </button>
            </div>
            <div className="justify-self-center">
                <button onClick={onAddSelected} disabled={selectionCount === 0} className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white disabled:bg-gray-400">
                    Добавить {selectionCount > 0 ? `(${selectionCount})` : ''} фото
                </button>
            </div>
            <div className="justify-self-end flex items-center gap-2">
                <div className="flex items-center p-0.5 bg-gray-200 rounded-md">
                    {[3, 4, 5].map(size => (
                        <button key={size} onClick={() => onGridSizeChange(size)} title={`Сетка ${size}x${size}`} className={`p-2 rounded ${gridSize === size ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              {Array.from({length: size * size}).map((_, i) => {
                                const col = i % size;
                                const row = Math.floor(i / size);
                                const s = 16/size;
                                const gap = s > 4 ? 1.5 : 1;
                                return <rect key={i} x={col * s + gap/2} y={row * s + gap/2} width={s - gap} height={s - gap} rx="1"/>
                              })}
                            </svg>
                        </button>
                    ))}
                </div>
                <button onClick={onUploadClick} className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors">Загрузить фото</button>
                <button onClick={onRefresh} disabled={isLoadingPhotos} title="Обновить фотографии из VK" className="p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-wait">
                    {isLoadingPhotos ? <div className="loader h-5 w-5 border-t-indigo-500"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>}
                </button>
            </div>
        </div>
    );
};
