
import React from 'react';
import { Album } from '../../../../shared/types';
import { AlbumSkeleton } from './GallerySkeletons';

interface AlbumListProps {
    albums: Album[];
    isLoadingAlbums: boolean;
    albumError: string | null;
    onSelectAlbum: (albumId: string) => void;
    onCreateAlbum: () => void;
    onRefreshAlbums: () => void;
}

export const AlbumList: React.FC<AlbumListProps> = ({
    albums, isLoadingAlbums, albumError,
    onSelectAlbum, onCreateAlbum, onRefreshAlbums,
}) => {
    if (isLoadingAlbums) return <AlbumSkeleton />;
    if (albumError) return <div className="text-sm text-red-600">{albumError}</div>;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {albums.map(album => (
                <button
                    key={album.id}
                    onClick={() => onSelectAlbum(album.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-indigo-400"
                >
                    <span className="whitespace-nowrap">{album.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-gray-200 text-gray-700">
                        {album.size}
                    </span>
                </button>
            ))}

            {albums.length === 0 && !isLoadingAlbums && <p className="text-sm text-gray-500 mr-2">Альбомы не найдены.</p>}

            <button
                type="button"
                onClick={onCreateAlbum}
                disabled={isLoadingAlbums}
                title="Создать новый альбом"
                className="px-3 py-1.5 text-xs font-medium border-2 border-dashed rounded-full transition-colors border-blue-400 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
            >
                + Создать альбом
            </button>
            <button
                onClick={onRefreshAlbums}
                disabled={isLoadingAlbums}
                title="Обновить список альбомов из VK"
                className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 disabled:cursor-wait"
            >
                {isLoadingAlbums ? <div className="loader h-4 w-4 border-2 border-gray-400 border-t-indigo-500"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>}
            </button>
        </div>
    );
};
