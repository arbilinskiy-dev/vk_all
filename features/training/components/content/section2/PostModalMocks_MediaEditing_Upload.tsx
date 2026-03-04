import React, { useState } from 'react';

// =====================================================================
// Компоненты загрузки медиафайлов
// =====================================================================

// Mock: Три способа загрузки
export const MockMediaUploadMethods: React.FC = () => {
    const [uploadedCount, setUploadedCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleUpload = (method: string) => {
        setUploadedCount(prev => prev + 1);
        setTimeout(() => {
            alert(`Загружено через: ${method}`);
        }, 100);
    };

    return (
        <div className="space-y-4">
            {/* Кнопки загрузки */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => handleUpload('кнопку "Загрузить"')}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                    Загрузить
                </button>
                <button 
                    onClick={() => handleUpload('галерею VK')}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                >
                    Добавить фото
                </button>
            </div>

            {/* Drag & Drop зона */}
            <div 
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsDragging(false); 
                    handleUpload('перетаскивание файлов');
                }}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging 
                        ? 'border-indigo-500 bg-indigo-100 bg-opacity-75' 
                        : 'border-gray-300 bg-gray-50'
                }`}
            >
                <svg 
                    className={`mx-auto h-12 w-12 transition-colors ${
                        isDragging ? 'text-indigo-500' : 'text-gray-400'
                    }`} 
                    stroke="currentColor" 
                    fill="none" 
                    viewBox="0 0 48 48"
                >
                    <path 
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                    />
                </svg>
                <p className={`mt-2 text-sm font-semibold ${isDragging ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {isDragging ? 'Отпустите файлы для загрузки' : 'Перетащите файлы сюда'}
                </p>
            </div>

            {/* Счётчик загрузок */}
            {uploadedCount > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                        ✅ Загружено файлов: {uploadedCount}
                    </p>
                </div>
            )}
        </div>
    );
};

// Mock: Состояния загрузки
export const MockUploadStates: React.FC = () => {
    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {/* Обычное изображение */}
            <div className="relative aspect-square group">
                <img 
                    src="https://picsum.photos/seed/state-1/200/200" 
                    className="w-full h-full object-cover rounded" 
                    alt="Загружено"
                />
                <button className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    &times;
                </button>
            </div>

            {/* Загрузка */}
            <div className="relative aspect-square">
                <img 
                    src="https://picsum.photos/seed/state-2/200/200" 
                    className="w-full h-full object-cover rounded opacity-50" 
                    alt="Загрузка"
                />
                <div className="absolute inset-0 rounded flex items-center justify-center text-white bg-black/50">
                    <div className="loader border-white border-t-transparent"></div>
                </div>
            </div>

            {/* Ошибка */}
            <div className="relative aspect-square">
                <img 
                    src="https://picsum.photos/seed/state-3/200/200" 
                    className="w-full h-full object-cover rounded opacity-50" 
                    alt="Ошибка"
                />
                <div className="absolute inset-0 rounded flex items-center justify-center text-white bg-red-800/80">
                    <div className="text-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs">Ошибка</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock: Состояния загрузки фото в альбом
export const MockPhotoUploadStates: React.FC = () => {
    return (
        <div className="grid grid-cols-3 gap-3">
            {/* Загрузка (uploading) */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 text-center">Загрузка</p>
                <div className="relative aspect-square">
                    <img 
                        src="https://picsum.photos/seed/upload-1/200/200" 
                        className="w-full h-full object-cover rounded opacity-50" 
                        alt="Загрузка"
                    />
                    <div className="absolute inset-0 rounded flex items-center justify-center text-white bg-black/50">
                        <div className="loader border-white border-t-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Успешно загружено (completed) */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 text-center">Загружено</p>
                <div className="relative aspect-square group">
                    <img 
                        src="https://picsum.photos/seed/upload-2/200/200" 
                        className="w-full h-full object-cover rounded" 
                        alt="Загружено"
                    />
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-sm border-2 border-white bg-black/25 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Ошибка (failed) */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 text-center">Ошибка</p>
                <div className="relative aspect-square">
                    <img 
                        src="https://picsum.photos/seed/upload-3/200/200" 
                        className="w-full h-full object-cover rounded opacity-50" 
                        alt="Ошибка"
                    />
                    <div className="absolute inset-0 rounded flex items-center justify-center text-white bg-red-800/80">
                        <div className="text-center p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs mt-1">Превышен размер</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
