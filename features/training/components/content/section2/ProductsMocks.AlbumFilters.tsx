import React from 'react';
import type { MockAlbum } from './ProductsMocks.types';

// =====================================================================
// MockAlbumFilters — фильтры по подборкам
// =====================================================================
interface MockAlbumFiltersProps {
    albums: MockAlbum[];
    activeAlbumId: number | null;
    onAlbumSelect: (albumId: number | null) => void;
    onCreateAlbum?: () => void;
}

export const MockAlbumFilters: React.FC<MockAlbumFiltersProps> = ({
    albums,
    activeAlbumId,
    onAlbumSelect,
    onCreateAlbum
}) => {
    return (
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Кнопка "Все товары" */}
                <button
                    onClick={() => onAlbumSelect(null)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border whitespace-nowrap ${
                        activeAlbumId === null
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Все товары
                </button>

                {/* Кнопки подборок */}
                {albums.map((album) => (
                    <button
                        key={album.id}
                        onClick={() => onAlbumSelect(album.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border whitespace-nowrap ${
                            activeAlbumId === album.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {album.title} ({album.count})
                    </button>
                ))}

                {/* Кнопка "+ Создать подборку" */}
                <button
                    onClick={onCreateAlbum}
                    className="px-3 py-1.5 text-sm font-medium border-2 border-dashed rounded-md transition-colors border-blue-400 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                >
                    + Создать подборку
                </button>
            </div>
        </div>
    );
};
