import React from 'react';
import { Photo } from '../../../shared/types';
import { ImagePreviewModal } from '../../../shared/components/modals/ImagePreviewModal';
import { CreateAlbumModal } from './modals/CreateAlbumModal';
import { UploadConfirmationModal } from './modals/UploadConfirmationModal';

// Подкомпоненты из image-gallery/
import { useImageGalleryLogic } from './image-gallery/useImageGalleryLogic';
import { AlbumList } from './image-gallery/AlbumList';
import { GalleryToolbar } from './image-gallery/GalleryToolbar';
import { PhotoGrid } from './image-gallery/PhotoGrid';

interface ImageGalleryProps {
    projectId: string;
    onAddImages: (photos: Photo[]) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ projectId, onAddImages }) => {
    const { state, actions, refs } = useImageGalleryLogic({ projectId });

    const {
        tab, albums, selectedAlbumId, selectedAlbum,
        isLoadingAlbums, albumError, isCreateAlbumModalOpen,
        photos, hasMore, isLoadingPhotos, photoError, uploadingPhotos,
        selection, previewImage, gridSize,
        isDraggingOver, filesToConfirm,
    } = state;

    const {
        setTab, setGridSize, setPreviewImage,
        setIsCreateAlbumModalOpen,
        fetchAlbums,
        handleSelectAlbum, handleBackToAlbums, handleRefreshPhotos,
        handleImageSelect, handleFileSelect,
        handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
        handleConfirmUpload, setFilesToConfirm,
    } = actions;

    const { loadMoreRef, fileInputRef } = refs;

    return (
        <div className="mt-4 border-t pt-4 animate-fade-in-up">
            <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
            <div className={`flex flex-col flex-grow overflow-hidden border rounded-lg ${selectedAlbumId ? 'h-[50vh] min-h-[400px]' : ''}`}>
                <header className="p-3 border-b bg-gray-50 flex-shrink-0">
                    <div className="flex border-b">
                        <button onClick={() => setTab('project')} className={`px-4 py-2 text-sm font-medium flex-1 ${tab === 'project' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>Проект</button>
                        <button onClick={() => setTab('agency')} className={`px-4 py-2 text-sm font-medium flex-1 ${tab === 'agency' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>Агентство</button>
                    </div>
                </header>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Список альбомов (скрывается при выбранном альбоме) */}
                    <div className={`transition-all duration-500 ease-in-out ${selectedAlbumId ? 'max-h-0 opacity-0' : 'max-h-full opacity-100'}`}>
                         <div className="p-4 border-b">
                            <AlbumList
                                albums={albums}
                                isLoadingAlbums={isLoadingAlbums}
                                albumError={albumError}
                                onSelectAlbum={handleSelectAlbum}
                                onCreateAlbum={() => setIsCreateAlbumModalOpen(true)}
                                onRefreshAlbums={() => fetchAlbums(true)}
                            />
                        </div>
                    </div>
                    
                    {/* Сетка фотографий с тулбаром */}
                    <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out overflow-hidden ${selectedAlbumId ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'}`}>
                        {selectedAlbumId && (
                            <GalleryToolbar
                                selectionCount={selection.length}
                                gridSize={gridSize}
                                isLoadingPhotos={isLoadingPhotos}
                                onBack={handleBackToAlbums}
                                onAddSelected={() => onAddImages(selection)}
                                onGridSizeChange={setGridSize}
                                onUploadClick={() => fileInputRef.current?.click()}
                                onRefresh={() => handleRefreshPhotos(selectedAlbumId)}
                            />
                        )}
                        <main 
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="relative flex-1 p-4 overflow-y-auto custom-scrollbar transition-all duration-200 rounded-b-lg"
                        >
                             {selectedAlbumId && (
                                 <PhotoGrid
                                     photos={photos}
                                     uploadingPhotos={uploadingPhotos}
                                     selection={selection}
                                     gridSize={gridSize}
                                     isLoadingPhotos={isLoadingPhotos}
                                     hasMore={hasMore}
                                     photoError={photoError}
                                     loadMoreRef={loadMoreRef}
                                     onImageSelect={handleImageSelect}
                                     onPreview={setPreviewImage}
                                 />
                             )}
                             {isDraggingOver && (
                                <div 
                                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 bg-indigo-100 bg-opacity-75 border-2 border-dashed border-indigo-500 rounded-lg"
                                >
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="mt-2 text-sm font-semibold text-indigo-700">
                                            Загрузить в альбом "{selectedAlbum?.name}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
            
            {previewImage && (
                <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)}>
                    <button 
                        onClick={() => handleImageSelect(previewImage!)} 
                        className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-lg text-white shadow-lg transition-colors ${selection.some(p => p.id === previewImage!.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {selection.some(p => p.id === previewImage!.id) ? '✓ Убрать' : 'Выбрать'}
                    </button>
                </ImagePreviewModal>
            )}

            {isCreateAlbumModalOpen && (
                <CreateAlbumModal
                    projectId={projectId}
                    onClose={() => setIsCreateAlbumModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateAlbumModalOpen(false);
                        fetchAlbums(true); // Принудительно обновляем список альбомов
                    }}
                />
            )}
            
             {filesToConfirm.length > 0 && (
                <UploadConfirmationModal
                    fileCount={filesToConfirm.length}
                    uploadTargetName={`альбом "${selectedAlbum?.name || ''}"`}
                    onConfirm={handleConfirmUpload}
                    onCancel={() => setFilesToConfirm([])}
                />
            )}
        </div>
    );
};