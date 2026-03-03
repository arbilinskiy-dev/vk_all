
import React from 'react';
import { Photo } from '../../../../shared/types';
import { LazyImage } from '../../../../shared/components/LazyImage';
import { UploadingPhoto } from './types';
import { UploadingPhotoGridItem } from './UploadingPhotoGridItem';
import { getGridColsClass, GallerySkeleton } from './GallerySkeletons';

interface PhotoGridProps {
    photos: Photo[];
    uploadingPhotos: UploadingPhoto[];
    selection: Photo[];
    gridSize: number;
    isLoadingPhotos: boolean;
    hasMore: boolean;
    photoError: string | null;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    onImageSelect: (photo: Photo) => void;
    onPreview: (photo: Photo) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos, uploadingPhotos, selection, gridSize,
    isLoadingPhotos, hasMore, photoError, loadMoreRef,
    onImageSelect, onPreview,
}) => {
    // Скелетон при первой загрузке
    if (isLoadingPhotos && photos.length === 0 && uploadingPhotos.length === 0) {
        return <GallerySkeleton gridSize={gridSize} />;
    }

    // Ошибка загрузки фото
    if (photoError) {
        return <div className="text-red-600 text-center py-4">{photoError}</div>;
    }

    // Пустой альбом
    if (photos.length === 0 && !isLoadingPhotos && uploadingPhotos.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4">
                В этом альбоме нет фотографий.
                <br/>
                Перетащите файлы сюда или используйте кнопки для загрузки.
            </div>
        );
    }

    return (
        <>
            <div className={`grid ${getGridColsClass(gridSize)} gap-3`}>
                {uploadingPhotos.map(item => <UploadingPhotoGridItem key={item.tempId} item={item} />)}
                {photos.map((photo, idx) => {
                    const isSelected = selection.some(p => p.id === photo.id);
                    return (
                        <div 
                            key={photo.id} 
                            className="relative aspect-square cursor-pointer group opacity-0 animate-fade-in-up" 
                            style={{ animationDelay: `${idx * 20}ms` }}
                            onClick={() => onImageSelect(photo)}
                        >
                            <LazyImage src={photo.url} alt="" className="w-full h-full object-cover rounded-md smooth-scaling"/>
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-sm border-2 border-white bg-black/25 flex items-center justify-center">
                                {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <div className={`absolute inset-0 ring-2 ring-offset-2 ring-indigo-500 rounded-md transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                            <button onClick={(e) => { e.stopPropagation(); onPreview(photo); }} className="absolute bottom-1 right-1 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100" title="Увеличить">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                        </div>
                    );
                })}
            </div>
            {isLoadingPhotos && photos.length > 0 && <div className="flex justify-center mt-4 col-span-full"><div className="loader"></div></div>}
            {hasMore && !isLoadingPhotos && <div ref={loadMoreRef} className="h-1 col-span-full"></div>}
        </>
    );
};
