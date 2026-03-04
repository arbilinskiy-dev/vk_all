import React, { useState } from 'react';

// =====================================================================
// Компоненты галереи VK: альбомы, перетаскивание, создание
// =====================================================================

// Mock: Галерея VK с альбомами
export const MockVKGallery: React.FC = () => {
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

    const albums = [
        { id: 'wall', name: 'Фото со стены', count: 156 },
        { id: 'profile', name: 'Фото профиля', count: 12 },
        { id: 'saved', name: 'Сохранённые фото', count: 89 },
        { id: 'custom', name: 'Мой альбом', count: 45 },
    ];

    const photos = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        url: `https://picsum.photos/seed/vk-${i}/200/200`,
    }));

    const togglePhoto = (id: number) => {
        setSelectedPhotos(prev => 
            prev.includes(id) 
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-white">
            {/* Вкладки */}
            <div className="p-3 border-b bg-gray-50">
                <div className="flex border-b">
                    <button className="px-4 py-2 text-sm font-medium flex-1 border-b-2 border-indigo-500 text-indigo-600">
                        Проект
                    </button>
                    <button className="px-4 py-2 text-sm font-medium flex-1 border-b-2 border-transparent text-gray-500">
                        Агентство
                    </button>
                </div>
            </div>

            {/* Список альбомов */}
            {!selectedAlbum && (
                <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {albums.map(album => (
                            <button
                                key={album.id}
                                onClick={() => setSelectedAlbum(album.id)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-indigo-400"
                            >
                                <span>{album.name}</span>
                                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">
                                    {album.count}
                                </span>
                            </button>
                        ))}
                        <button className="px-3 py-1.5 text-xs font-medium border-2 border-dashed rounded-full border-blue-400 text-blue-600 bg-white hover:bg-blue-50">
                            + Создать альбом
                        </button>
                    </div>
                </div>
            )}

            {/* Сетка фото */}
            {selectedAlbum && (
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button 
                            onClick={() => { setSelectedAlbum(null); setSelectedPhotos([]); }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            ← Альбомы
                        </button>
                        <button 
                            disabled={selectedPhotos.length === 0}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white disabled:bg-gray-400"
                        >
                            Добавить {selectedPhotos.length > 0 ? `(${selectedPhotos.length})` : ''} фото
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {photos.map(photo => {
                            const isSelected = selectedPhotos.includes(photo.id);
                            return (
                                <div 
                                    key={photo.id}
                                    onClick={() => togglePhoto(photo.id)}
                                    className="relative aspect-square cursor-pointer group"
                                >
                                    <img 
                                        src={photo.url} 
                                        alt="" 
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                    <div className="absolute top-1 right-1 w-5 h-5 rounded-sm border-2 border-white bg-black/25 flex items-center justify-center">
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <div className="absolute inset-0 ring-2 ring-offset-2 ring-indigo-500 rounded-md"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Mock: Drag & Drop оверлей при перетаскивании
export const MockDragDropOverlay: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="space-y-4">
            <button 
                onClick={() => setIsDragging(!isDragging)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
                {isDragging ? 'Отпустить файлы' : 'Симуляция перетаскивания'}
            </button>

            <div className="relative border-2 border-gray-300 rounded-lg p-8 bg-gray-50 h-64">
                <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="aspect-square">
                            <img 
                                src={`https://picsum.photos/seed/drag-${i}/150/150`} 
                                alt="" 
                                className="w-full h-full object-cover rounded"
                            />
                        </div>
                    ))}
                </div>

                {isDragging && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-indigo-100 bg-opacity-75 border-2 border-dashed border-indigo-500 rounded-lg">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm font-semibold text-indigo-700">
                                Загрузить в альбом "Мой альбом"
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Mock: Модалка создания альбома (доработанная версия с валидацией)
export const MockCreateAlbumModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        if (!title.trim()) {
            setError('Название альбома не может быть пустым.');
            return;
        }
        setIsSaving(true);
        setError(null);
        setTimeout(() => {
            setIsSaving(false);
            setIsOpen(false);
            setTitle('');
        }, 1500);
    };

    const handleClose = () => {
        setIsOpen(false);
        setTitle('');
        setError(null);
    };

    return (
        <div>
            <button 
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 text-xs font-medium border-2 border-dashed rounded-full border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
            >
                + Создать альбом
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={handleClose}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <header className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Создать новый альбом</h2>
                            <button 
                                onClick={handleClose}
                                disabled={isSaving}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                title="Закрыть"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </header>
                        <main className="p-6 space-y-4">
                            <div>
                                <label htmlFor="album-title-mock" className="block text-sm font-medium text-gray-700 mb-1">
                                    Название альбома
                                </label>
                                <input
                                    id="album-title-mock"
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    disabled={isSaving}
                                    placeholder="Например, 'Акции Июля'"
                                    className="w-full border rounded p-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>
                            )}
                        </main>
                        <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button 
                                onClick={handleClose}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!title.trim() || isSaving}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 w-28 flex justify-center items-center"
                            >
                                {isSaving ? (
                                    <div className="loader border-white border-t-transparent h-4 w-4"></div>
                                ) : (
                                    'Создать'
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};
