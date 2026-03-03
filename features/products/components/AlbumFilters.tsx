
import React, { useState } from 'react';
import { MarketAlbum } from '../../../shared/types';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';

interface AlbumFiltersProps {
    albums: MarketAlbum[];
    itemsCount: number;
    itemsWithoutAlbumCount: number;
    isLoading: boolean;
    activeAlbumId: string;
    onSelectAlbum: (albumId: string) => void;
    // Пропсы для создания подборки
    isCreatingAlbum: boolean;
    setIsCreatingAlbum: (isCreating: boolean) => void;
    newAlbumTitle: string;
    setNewAlbumTitle: (title: string) => void;
    handleCreateAlbum: () => void;
    // Пропсы для редактирования подборки
    editingAlbumId: number | null;
    editingAlbumTitle: string;
    handleStartEditAlbum: (albumId: number, currentTitle: string) => void;
    handleSaveEditAlbum: () => void;
    handleCancelEditAlbum: () => void;
    setEditingAlbumTitle: (title: string) => void;
    // Флаг сохранения (защита от двойного клика)
    isSavingAlbum: boolean;
    // Пропсы для удаления подборки
    handleDeleteAlbum: (albumId: number) => void;
}

const Skeleton: React.FC = () => (
    <div className="flex items-center gap-2 flex-wrap animate-pulse">
        <div className="h-9 w-28 bg-gray-200 rounded-md"></div>
        <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
        <div className="h-9 w-40 bg-gray-200 rounded-md"></div>
        <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
    </div>
);

export const AlbumFilters: React.FC<AlbumFiltersProps> = ({
    albums, itemsCount, itemsWithoutAlbumCount, isLoading, activeAlbumId, onSelectAlbum,
    isCreatingAlbum, setIsCreatingAlbum, newAlbumTitle, setNewAlbumTitle, handleCreateAlbum,
    editingAlbumId, editingAlbumTitle, handleStartEditAlbum, handleSaveEditAlbum, handleCancelEditAlbum, setEditingAlbumTitle,
    isSavingAlbum, handleDeleteAlbum
}) => {
    // Локальное состояние для модалки подтверждения удаления
    const [albumToDelete, setAlbumToDelete] = useState<MarketAlbum | null>(null);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

    const onConfirmDelete = async () => {
        if (!albumToDelete) return;
        setIsDeletingAlbum(true);
        await handleDeleteAlbum(albumToDelete.id);
        setIsDeletingAlbum(false);
        setAlbumToDelete(null);
    };

    return (
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            {isLoading ? (
                <Skeleton />
            ) : (
                <div className="flex items-center gap-2 flex-wrap">
                    <button 
                        onClick={() => onSelectAlbum('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border whitespace-nowrap ${activeAlbumId === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Все - {itemsCount}
                    </button>

                    {/* Справка о подборках */}
                    {albums.length > 0 && (() => {
                        const ownerId = albums[0]?.owner_id;
                        const vkAlbumsUrl = ownerId ? `https://vk.com/market${ownerId}?display_albums=true` : null;
                        return (
                            <div className="relative group">
                                <button type="button" className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" title="Справка о подборках">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <div className="absolute left-0 top-full mt-1 w-72 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 leading-relaxed">
                                    <p>Здесь отображаются подборки, которые содержат товары, а также пустые подборки, созданные через нашу систему.</p>
                                    {vkAlbumsUrl && (
                                        <p className="mt-1.5">
                                            Актуальное количество подборок можно проверить{' '}
                                            <a href={vkAlbumsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                                                в VK
                                            </a>.
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    
                    {/* Кнопка "Без подборки" отображается только если такие товары есть */}
                    {itemsWithoutAlbumCount > 0 && (
                        <button 
                            onClick={() => onSelectAlbum('none')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border whitespace-nowrap ${activeAlbumId === 'none' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Без подборки - {itemsWithoutAlbumCount}
                        </button>
                    )}
                    
                    {albums.map(album => {
                        const isActive = String(album.id) === activeAlbumId;
                        const isEditing = editingAlbumId === album.id;
                        const wrapperClass = `inline-flex items-center text-sm font-medium rounded-md transition-colors border ${
                            isActive 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`;

                        // Режим инлайн-редактирования названия подборки
                        if (isEditing) {
                            return (
                                <div key={album.id} className="inline-flex items-center gap-1.5 animate-fade-in-up">
                                    <input
                                        type="text"
                                        value={editingAlbumTitle}
                                        onChange={(e) => setEditingAlbumTitle(e.target.value)}
                                        className="border rounded px-3 py-1.5 text-sm border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEditAlbum();
                                            if (e.key === 'Escape') handleCancelEditAlbum();
                                        }}
                                    />
                                    <button onClick={handleSaveEditAlbum} className="p-1.5 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50" title="Сохранить">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <button onClick={handleCancelEditAlbum} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100" title="Отмена">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={album.id} className={wrapperClass}>
                                <button
                                    onClick={() => onSelectAlbum(String(album.id))}
                                    className="px-3 py-1.5 focus:outline-none rounded-l-md whitespace-nowrap"
                                >
                                    {album.title} - {album.count}
                                </button>
                                <div className={`w-px h-4 ${isActive ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
                                {/* Кнопка редактирования */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleStartEditAlbum(album.id, album.title); }}
                                    className="px-1.5 py-1.5 hover:opacity-75 focus:outline-none flex items-center"
                                    title="Переименовать подборку"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                {/* Кнопка удаления */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setAlbumToDelete(album); }}
                                    className="px-1.5 py-1.5 hover:opacity-75 focus:outline-none flex items-center"
                                    title="Удалить подборку"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <div className={`w-px h-4 ${isActive ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
                                {/* Ссылка на VK */}
                                <a
                                    href={`https://vk.com/market${album.owner_id}?section=album_${album.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1.5 rounded-r-md hover:opacity-75 focus:outline-none flex items-center"
                                    title="Перейти в подборку VK"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        );
                    })}

                    {isCreatingAlbum ? (
                        <div className="flex items-center gap-2 animate-fade-in-up">
                            <input
                                type="text"
                                placeholder="Название новой подборки..."
                                value={newAlbumTitle}
                                onChange={(e) => setNewAlbumTitle(e.target.value)}
                                className="border rounded px-3 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
                            />
                            <button onClick={handleCreateAlbum} className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">Ок</button>
                            <button onClick={() => setIsCreatingAlbum(false)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100" title="Отмена">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                         <button
                            type="button"
                            onClick={() => setIsCreatingAlbum(true)}
                            title="Создать новую подборку"
                            className="px-3 py-1.5 text-sm font-medium border-2 border-dashed rounded-md transition-colors border-blue-400 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                        >
                            + Создать подборку
                        </button>
                    )}
                </div>
            )}

            {/* Модалка подтверждения удаления подборки */}
            {albumToDelete && (
                <ConfirmationModal
                    title="Удаление подборки"
                    message={`Вы уверены, что хотите удалить подборку «${albumToDelete.title}»?\n\nТовары из подборки не будут удалены, они останутся без подборки.`}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    confirmButtonVariant="danger"
                    isConfirming={isDeletingAlbum}
                    onConfirm={onConfirmDelete}
                    onCancel={() => setAlbumToDelete(null)}
                />
            )}
        </div>
    );
};