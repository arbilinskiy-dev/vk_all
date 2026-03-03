
import React from 'react';
import { usePostMediaLogic } from '../../hooks/usePostMediaLogic';
import { PostMediaSectionProps } from './media/types';
import { MediaGridItem } from './media/MediaGridItem';
import { UploadingGridItem } from './media/UploadingGridItem';
import { ViewImageItem } from './media/ViewImageItem';
import { HoverPreview } from './media/HoverPreview';
import { VideoUploadCard } from './media/VideoUploadCard';
import { AttachmentsDisplay } from '../AttachmentsDisplay';
import { ImageGallery } from '../ImageGallery';
import { UploadConfirmationModal } from './UploadConfirmationModal';
import { ImagePreviewModal } from '../../../../shared/components/modals/ImagePreviewModal';

export type { PostMediaSectionProps } from './media/types';

export const PostMediaSection: React.FC<PostMediaSectionProps> = ({
    mode,
    editedImages,
    onImagesChange,
    onUploadStateChange,
    postAttachments,
    editedAttachments,
    onAttachmentsChange,
    projectId,
    collapsible = false,
    showAttachments = true,
    onVideoFileStored,
    onVideoFileRemoved,
}) => {
    const { state, actions, refs } = usePostMediaLogic({
        mode, editedImages, onImagesChange, onUploadStateChange,
        onAttachmentsChange, projectId, collapsible, onVideoFileStored,
    });

    // Глобальный индекс для сквозного рендеринга обоих массивов
    let globalRenderIndex = 0;

    return (
        <>
            <input
                type="file"
                ref={refs.fileInputRef}
                multiple
                accept="image/jpeg, image/png, image/gif, image/webp"
                onChange={actions.handleFileSelect}
                className="hidden"
            />
            <input
                type="file"
                ref={refs.videoInputRef}
                accept="video/mp4, video/avi, video/quicktime, video/x-msvideo, video/webm, video/x-matroska"
                onChange={actions.handleVideoSelect}
                className="hidden"
            />
            
            <div 
                onDragEnter={actions.handleContainerDragEnter}
                onDragLeave={actions.handleContainerDragLeave}
                onDragOver={actions.handleContainerDragOver}
                onDrop={actions.handleContainerDrop}
                className="relative p-2 rounded-lg"
            >
                {showAttachments && (
                    <AttachmentsDisplay 
                        mode={mode} 
                        attachments={state.isEditable ? editedAttachments : postAttachments} 
                        onRemoveAttachment={(id) => {
                            onAttachmentsChange(prev => prev.filter(a => a.id !== id));
                            // Очищаем сохранённый File видео при удалении аттачмента
                            onVideoFileRemoved?.(id);
                        }} 
                    />
                )}

                {/* Карточка загрузки видео / ошибка */}
                <VideoUploadCard
                    isVideoUploading={state.isVideoUploading}
                    videoUploadError={state.videoUploadError}
                    onCancelUpload={actions.cancelVideoUpload}
                />
                
                <div>
                     <div className="flex justify-between items-end mb-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Изображения - {editedImages.length}</label>
                            {state.isEditable && editedImages.length > 1 && (
                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 select-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                                    </svg>
                                    Можно менять порядок перетаскиванием
                                </p>
                            )}
                        </div>
                        {state.isEditable && (
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => refs.fileInputRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors">Загрузить</button>
                                <button 
                                    type="button" 
                                    onClick={() => refs.videoInputRef.current?.click()} 
                                    disabled={state.isVideoUploading}
                                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Видео
                                </button>
                                <button type="button" onClick={() => actions.setIsGalleryOpen(prev => !prev)} className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200">{state.isGalleryOpen ? 'Скрыть галерею' : 'Добавить фото'}</button>
                            </div>
                        )}
                     </div>
                     
                     {state.isEditable ? (
                         <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                            {editedImages.map((item, index) => {
                                const currentIndex = globalRenderIndex++;
                                if (state.shouldCollapse && currentIndex >= state.COLLAPSE_LIMIT) return null;
                                const isOverlay = state.shouldCollapse && currentIndex === state.COLLAPSE_LIMIT - 1;

                                return (
                                    <div key={item.id} className="relative w-full h-full">
                                        <MediaGridItem 
                                            imageUrl={item.url}
                                            isEditing={state.isEditable}
                                            onRemove={() => actions.handleRemoveItem(item.id)}
                                            onClick={() => actions.setPreviewImage(item)}
                                            // DnD props
                                            onDragStart={(e) => actions.handleItemDragStart(e, index)}
                                            onDragOver={(e) => actions.handleItemDragOver(e, index)}
                                            onDrop={(e) => actions.handleItemDrop(e, index)}
                                        />
                                        {isOverlay && (
                                            <div 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.setIsExpanded(true); }}
                                                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:bg-black/50 transition-colors z-20 backdrop-blur-[1px]"
                                                title="Показать все фото"
                                            >
                                                +{state.hiddenCount}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {state.uploadingFiles.map((item) => {
                                const currentIndex = globalRenderIndex++;
                                if (state.shouldCollapse && currentIndex >= state.COLLAPSE_LIMIT) return null;
                                const isOverlay = state.shouldCollapse && currentIndex === state.COLLAPSE_LIMIT - 1;

                                return (
                                    <div key={item.tempId} className="relative w-full h-full">
                                        <UploadingGridItem item={item} />
                                         {isOverlay && (
                                            <div 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.setIsExpanded(true); }}
                                                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:bg-black/50 transition-colors z-20 backdrop-blur-[1px]"
                                            >
                                                +{state.hiddenCount}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                     ) : editedImages.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 py-4">
                            {editedImages.map((img, index) => (
                                <div
                                    key={img.id}
                                    className="relative h-28 w-28 rounded-lg shadow-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
                                    onClick={() => actions.setPreviewImage(img)}
                                    onMouseEnter={(e) => actions.handleImageMouseEnter(e, img.url)}
                                    onMouseLeave={actions.handleImageMouseLeave}
                                >
                                    <ViewImageItem url={img.url} alt={`Post image ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                     ) : null}
                     
                     {!state.isGalleryOpen && editedImages.length === 0 && state.uploadingFiles.length === 0 && (
                        <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-md text-center">
                            Изображения не добавлены
                            {state.isEditable && <span className="block text-xs mt-1">Перетащите файлы сюда или используйте кнопки выше</span>}
                        </div>
                     )}

                     {/* Кнопка "Свернуть" */}
                     {collapsible && state.isExpanded && state.totalItems > state.COLLAPSE_LIMIT && (
                        <button 
                            onClick={() => actions.setIsExpanded(false)} 
                            className="text-xs text-indigo-600 mt-2 hover:underline font-medium flex items-center gap-1 ml-auto"
                        >
                            Свернуть
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                     )}
                     
                     {state.isGalleryOpen && <ImageGallery projectId={projectId} onAddImages={actions.handleAddImagesFromGallery} />}
                </div>

                {state.isDraggingOver && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-100 bg-opacity-75">
                        <div className="text-center">
                             <svg className="mx-auto h-12 w-12 text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm font-semibold text-indigo-700">Перетащите файлы для загрузки</p>
                            <p className="text-xs text-indigo-500 mt-0.5">Изображения и видео</p>
                        </div>
                    </div>
                )}
            </div>
            
            {state.filesToConfirm.length > 0 && (
                <UploadConfirmationModal
                    fileCount={state.filesToConfirm.length}
                    uploadTargetName="к публикации"
                    onConfirm={actions.handleConfirmUpload}
                    onCancel={() => actions.setFilesToConfirm([])}
                />
            )}

            {state.previewImage && (
                <ImagePreviewModal image={state.previewImage} onClose={() => actions.setPreviewImage(null)} />
            )}
            
            {state.hoveredImage && <HoverPreview url={state.hoveredImage.url} rect={state.hoveredImage.rect} isExiting={state.isExitingPreview} />}
        </>
    );
};
