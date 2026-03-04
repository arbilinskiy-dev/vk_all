/**
 * Mock-компоненты и данные для демонстрации фильтров по альбомам товаров.
 *
 * Содержит:
 *   - Интерфейсы MockAlbum / MockProduct
 *   - Набор тестовых данных mockAlbums / mockProducts
 *   - Компонент AlbumFiltersMock  — панель кнопок-фильтров по подборкам
 *   - Компонент ProductCardMini   — миниатюрная карточка товара
 */
import React, { useState } from 'react';

// =====================================================================
// Типы
// =====================================================================

export interface MockAlbum {
    id: number;
    owner_id: number;
    title: string;
    count: number;
}

export interface MockProduct {
    id: number;
    title: string;
    album_ids: number[];
}

// =====================================================================
// Mock-данные
// =====================================================================

export const mockAlbums: MockAlbum[] = [
    { id: 1, owner_id: -123456789, title: 'Новинки', count: 12 },
    { id: 2, owner_id: -123456789, title: 'Акции', count: 8 },
    { id: 3, owner_id: -123456789, title: 'Популярные', count: 15 },
];

export const mockProducts: MockProduct[] = [
    { id: 1, title: 'Футболка классическая', album_ids: [1, 3] },
    { id: 2, title: 'Кроссовки спортивные', album_ids: [1] },
    { id: 3, title: 'Джинсы slim fit', album_ids: [3] },
    { id: 4, title: 'Куртка демисезонная', album_ids: [2] },
    { id: 5, title: 'Рюкзак городской', album_ids: [] },
    { id: 6, title: 'Шапка вязаная', album_ids: [] },
];

// =====================================================================
// Компонент панели фильтров по альбомам
// =====================================================================

export const AlbumFiltersMock: React.FC<{
    albums: MockAlbum[];
    itemsCount: number;
    itemsWithoutAlbumCount: number;
    activeAlbumId: string;
    onSelectAlbum: (id: string) => void;
    isLoading?: boolean;
}> = ({ albums, itemsCount, itemsWithoutAlbumCount, activeAlbumId, onSelectAlbum, isLoading }) => {
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState('');

    // Скелетон загрузки
    if (isLoading) {
        return (
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex gap-2 flex-wrap">
                    <div className="h-9 w-28 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-9 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
            </div>
        );
    }

    const handleCreateClick = () => {
        if (newAlbumTitle.trim()) {
            alert(`Создана подборка: "${newAlbumTitle}"`);
            setNewAlbumTitle('');
            setIsCreatingAlbum(false);
        }
    };

    return (
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2 flex-wrap">
                {/* Кнопка "Все" */}
                <button
                    onClick={() => onSelectAlbum('all')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border ${
                        activeAlbumId === 'all'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Все - {itemsCount}
                </button>

                {/* Кнопка "Без подборки" (условная) */}
                {itemsWithoutAlbumCount > 0 && (
                    <button
                        onClick={() => onSelectAlbum('none')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border ${
                            activeAlbumId === 'none'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Без подборки - {itemsWithoutAlbumCount}
                    </button>
                )}

                {/* Кнопки альбомов */}
                {albums.map((album) => {
                    const isActive = activeAlbumId === String(album.id);
                    const wrapperClass = `flex items-center gap-2 rounded-md border transition-colors ${
                        isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`;

                    return (
                        <div key={album.id} className={wrapperClass}>
                            <button
                                onClick={() => onSelectAlbum(String(album.id))}
                                className="px-3 py-1.5 text-sm font-medium"
                            >
                                {album.title} - {album.count}
                            </button>
                            <div
                                className={`w-px h-4 ${isActive ? 'bg-indigo-400' : 'bg-gray-300'}`}
                            ></div>
                            <a
                                href={`https://vk.com/market${album.owner_id}?section=album_${album.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pr-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg
                                    className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </a>
                        </div>
                    );
                })}

                {/* Кнопка создания альбома */}
                {isCreatingAlbum ? (
                    <div className="flex items-center gap-2 animate-fade-in-up">
                        <input
                            type="text"
                            value={newAlbumTitle}
                            onChange={(e) => setNewAlbumTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateClick();
                                if (e.key === 'Escape') {
                                    setIsCreatingAlbum(false);
                                    setNewAlbumTitle('');
                                }
                            }}
                            placeholder="Название новой подборки..."
                            className="px-3 py-1.5 text-sm border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            onClick={handleCreateClick}
                            className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Ок
                        </button>
                        <button
                            onClick={() => {
                                setIsCreatingAlbum(false);
                                setNewAlbumTitle('');
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-700"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreatingAlbum(true)}
                        className="px-3 py-1.5 text-sm font-medium border-2 border-dashed border-blue-400 text-blue-600 bg-white rounded-md hover:bg-blue-50 transition-colors"
                    >
                        + Создать подборку
                    </button>
                )}
            </div>
        </div>
    );
};

// =====================================================================
// Миниатюрная карточка товара
// =====================================================================

export const ProductCardMini: React.FC<{ product: MockProduct }> = ({ product }) => (
    <div className="p-3 border border-gray-200 rounded-md bg-white">
        <p className="text-sm font-medium text-gray-900">{product.title}</p>
        <p className="text-xs text-gray-500 mt-1">
            {product.album_ids.length > 0
                ? `Подборки: ${product.album_ids.join(', ')}`
                : 'Без подборки'}
        </p>
    </div>
);
