/**
 * Шаг результатов поиска и редактирования
 * Показывает найденные посты и позволяет изменить их содержимое
 */

import React, { useState } from 'react';
import { Project, PhotoAttachment, Attachment } from '../../../../shared/types';
import { UnifiedPost } from '../../../schedule/hooks/useScheduleData';
import { BulkEditSearchResponse, FoundPost } from '../../../../services/api/bulk_edit.api';
import { EditFormState } from '../../hooks/useBulkEdit';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';
import { CustomDatePicker } from '../../../../shared/components/pickers/CustomDatePicker';
import { CustomTimePicker } from '../../../../shared/components/pickers/CustomTimePicker';

interface BulkEditResultsStepProps {
    sourcePost: UnifiedPost;
    allProjects: Project[];
    searchResponse: BulkEditSearchResponse;
    selectedPosts: Set<string>;
    editForm: EditFormState;
    isLoading: boolean;
    canApply: boolean;
    hasChanges: boolean;
    confirmationText: string;
    onTogglePostSelection: (postId: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onUpdateText: (text: string) => void;
    onUpdateImages: (images: PhotoAttachment[]) => void;
    onUpdateAttachments: (attachments: Attachment[]) => void;
    onToggleDateChange: (enabled: boolean) => void;
    onUpdateDate: (date: string) => void;
    onApply: () => void;
    onBack: () => void;
}

export const BulkEditResultsStep: React.FC<BulkEditResultsStepProps> = ({
    sourcePost,
    allProjects,
    searchResponse,
    selectedPosts,
    editForm,
    isLoading,
    canApply,
    hasChanges,
    confirmationText,
    onTogglePostSelection,
    onSelectAll,
    onDeselectAll,
    onUpdateText,
    onUpdateImages,
    onUpdateAttachments,
    onToggleDateChange,
    onUpdateDate,
    onApply,
    onBack
}) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Карта проектов для быстрого доступа
    const projectsMap = React.useMemo(() => {
        const map = new Map<string, Project>();
        allProjects.forEach(p => map.set(p.id, p));
        return map;
    }, [allProjects]);
    
    // Получить имя проекта
    const getProjectName = (projectId: string) => {
        return projectsMap.get(projectId)?.name || 'Неизвестный проект';
    };
    
    // Форматировать тип поста — стиль как в ScheduleSearch
    const getPostTypeBadge = (postType: string) => {
        switch (postType) {
            case 'published':
                return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide bg-green-100 text-green-800">Опубликован</span>;
            case 'scheduled':
                return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide bg-blue-100 text-blue-800">Отложен</span>;
            case 'system':
                return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide bg-purple-100 text-purple-800">Системный</span>;
            default:
                return null;
        }
    };
    
    // Форматировать дату
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Удаление изображения
    const handleRemoveImage = (imageId: string) => {
        const newImages = editForm.images.filter(img => img.id !== imageId);
        onUpdateImages(newImages);
    };
    
    // Подтверждение применения
    const handleConfirmApply = () => {
        setShowConfirmModal(false);
        onApply();
    };
    
    return (
        <>
            {/* Основной контент — вертикальный layout как в стандартной модалке */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                
                {/* Секция найденных постов */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                            Найденные посты ({searchResponse.matchedPosts.length})
                        </label>
                        <div className="flex gap-2 text-xs">
                            <button type="button" onClick={onSelectAll} className="text-indigo-600 hover:text-indigo-800">
                                Выбрать все
                            </button>
                            <span className="text-gray-300">|</span>
                            <button type="button" onClick={onDeselectAll} className="text-indigo-600 hover:text-indigo-800">
                                Снять все
                            </button>
                        </div>
                    </div>
                    
                    {searchResponse.matchedPosts.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto custom-scrollbar">
                            {searchResponse.matchedPosts.map((post, idx) => (
                                <div 
                                    key={post.id}
                                    onClick={() => onTogglePostSelection(post.id)}
                                    className={`p-3 cursor-pointer transition-colors ${
                                        idx !== 0 ? 'border-t border-gray-100' : ''
                                    } ${selectedPosts.has(post.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPosts.has(post.id)}
                                            onChange={() => onTogglePostSelection(post.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            {/* Заголовок: проект, статус, дата */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-gray-800">
                                                    {getProjectName(post.projectId)}
                                                </span>
                                                {getPostTypeBadge(post.postType)}
                                                <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                                            </div>
                                            
                                            {/* Превью текста */}
                                            {post.textPreview && (
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {post.textPreview}
                                                </p>
                                            )}
                                            
                                            {/* Миниатюры вложений */}
                                            {post.attachmentPreviews && post.attachmentPreviews.length > 0 && (
                                                <div className="flex gap-1 mt-2">
                                                    {post.attachmentPreviews.slice(0, 4).map((url, imgIdx) => (
                                                        <div 
                                                            key={imgIdx} 
                                                            className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0"
                                                        >
                                                            <img 
                                                                src={url} 
                                                                alt="" 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                    {post.attachmentPreviews.length > 4 && (
                                                        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                                                            +{post.attachmentPreviews.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-500">Совпадающих постов не найдено</p>
                        </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                        Выбрано: {selectedPosts.size} из {searchResponse.matchedPosts.length}
                    </div>
                </div>
                
                {/* Секции редактирования — показываем только если есть посты */}
                {searchResponse.matchedPosts.length > 0 && (
                    <>
                        <hr className="border-gray-200" />
                        
                        {/* Текст */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Текст публикации</label>
                                {editForm.textChanged && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Изменён</span>
                                )}
                            </div>
                            <textarea
                                value={editForm.text}
                                onChange={(e) => onUpdateText(e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                                placeholder="Введите новый текст..."
                            />
                        </div>
                        
                        {/* Изображения */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    Изображения ({editForm.images.length})
                                </label>
                                {editForm.imagesChanged && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Изменены</span>
                                )}
                            </div>
                            {editForm.images.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {editForm.images.map(img => (
                                        <div key={img.id} className="relative group">
                                            <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-md border border-gray-200" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(img.id)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Удалить"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                                    Нет изображений
                                </div>
                            )}
                        </div>
                        
                        {/* Дата */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.dateChanged}
                                    onChange={(e) => onToggleDateChange(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Изменить дату публикации</span>
                            </label>
                            {editForm.dateChanged && (
                                <div className="flex gap-2">
                                    <CustomDatePicker
                                        value={editForm.date.slice(0, 10)}
                                        onChange={(val) => {
                                            const time = editForm.date.slice(11, 16) || '12:00';
                                            onUpdateDate(`${val}T${time}:00Z`);
                                        }}
                                        className="flex-grow"
                                    />
                                    <CustomTimePicker
                                        value={editForm.date.slice(11, 16) || '12:00'}
                                        onChange={(val) => {
                                            const date = editForm.date.slice(0, 10);
                                            onUpdateDate(`${date}T${val}:00Z`);
                                        }}
                                        className="w-32"
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* Предупреждение */}
                        {!hasChanges && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex gap-2">
                                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-sm text-amber-800">
                                        Для применения изменений необходимо что-то изменить в тексте, изображениях или дате.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Футер */}
            <footer className="p-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                    ← Назад к поиску
                </button>
                
                <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!canApply}
                    className="px-6 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Применить к {selectedPosts.size} постам
                </button>
            </footer>
            
            {/* Модалка подтверждения */}
            {showConfirmModal && (
                <ConfirmationModal
                    title="Подтверждение"
                    message={confirmationText || `Применить изменения к ${selectedPosts.size} постам?`}
                    confirmText="Да, применить"
                    cancelText="Отмена"
                    confirmButtonVariant="primary"
                    onConfirm={handleConfirmApply}
                    onCancel={() => setShowConfirmModal(false)}
                    zIndex="z-[60]"
                />
            )}
        </>
    );
};
