
import React from 'react';
import { Project, ScheduledPost, PhotoAttachment, Attachment, GlobalVariableDefinition } from '../../../../../shared/types';
import { PostTextSection } from '../PostTextSection';
import { AttachmentsDisplay } from '../../AttachmentsDisplay';
import { PollSection } from '../../PollSection';
import { PostMediaSection } from '../PostMediaSection';
import { CommentTextEditor } from '../../../../../shared/components/CommentTextEditor';
import { AccordionSectionKey } from '../../../../projects/components/modals/ProjectSettingsModal';

interface ContentColumnProps {
    mode: 'view' | 'edit' | 'copy';
    // Текст
    postText: string;
    editedText: string;
    onTextChange: (text: string) => void;
    // Изображения
    editedImages: PhotoAttachment[];
    onImagesChange: React.Dispatch<React.SetStateAction<PhotoAttachment[]>>;
    // Вложения
    editedAttachments: Attachment[];
    onAttachmentsChange: React.Dispatch<React.SetStateAction<Attachment[]>>;
    formPostAttachments: Attachment[];
    // Загрузка медиа
    onUploadStateChange: (isUploading: boolean) => void;
    onVideoFileStored?: (attachmentId: string, file: File) => void;
    onVideoFileRemoved?: (attachmentId: string) => void;
    // Проект
    projectId: string;
    allProjects: Project[];
    currentProject: Project | null;
    // Переменные
    showVariables: boolean;
    onToggleVariables: () => void;
    onReloadVariables: () => void;
    variables: { name: string; value: string }[] | null;
    isLoadingVariables: boolean;
    globalVariables: GlobalVariableDefinition[] | null;
    isLoadingGlobalVariables: boolean;
    // Настройки проекта
    onOpenProjectSettings: (section: AccordionSectionKey | null) => void;
    // Первый комментарий
    firstCommentEnabled: boolean;
    firstCommentText: string;
    onFirstCommentTextChange: (text: string) => void;
    isSaving: boolean;
}

export const ContentColumn: React.FC<ContentColumnProps> = ({
    mode,
    postText, editedText, onTextChange,
    editedImages, onImagesChange,
    editedAttachments, onAttachmentsChange, formPostAttachments,
    onUploadStateChange, onVideoFileStored, onVideoFileRemoved,
    projectId, allProjects, currentProject,
    showVariables, onToggleVariables, onReloadVariables,
    variables, isLoadingVariables, globalVariables, isLoadingGlobalVariables,
    onOpenProjectSettings,
    firstCommentEnabled, firstCommentText, onFirstCommentTextChange, isSaving,
}) => {
    return (
        <div className="w-[25%] border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Контент</h3>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-5 space-y-4 flex-1 min-h-0">
                <PostTextSection
                    mode={mode}
                    postText={postText}
                    editedText={editedText}
                    onTextChange={onTextChange}
                    projectId={projectId}
                    allProjects={allProjects}
                    showVariables={showVariables}
                    onToggleVariables={onToggleVariables}
                    onReloadVariables={onReloadVariables}
                    variables={variables}
                    isLoadingVariables={isLoadingVariables}
                    globalVariables={globalVariables}
                    isLoadingGlobalVariables={isLoadingGlobalVariables}
                    onOpenProjectSettings={onOpenProjectSettings}
                />
                
                {/* Блок «Вложения» — всегда виден под текстовым полем */}
                <AttachmentsDisplay
                    mode={mode}
                    attachments={mode === 'edit' || mode === 'copy' ? editedAttachments : formPostAttachments}
                    onRemoveAttachment={(id) => {
                        onAttachmentsChange(prev => prev.filter(a => a.id !== id));
                        onVideoFileRemoved?.(id);
                    }}
                />

                {/* Блок «Опрос» — форма рядом с карточкой вложения опроса */}
                <PollSection
                    attachments={editedAttachments}
                    onAttachmentsChange={onAttachmentsChange}
                    mode={mode}
                />

                <PostMediaSection
                    mode={mode}
                    editedImages={editedImages}
                    onImagesChange={onImagesChange}
                    onUploadStateChange={onUploadStateChange}
                    postAttachments={formPostAttachments}
                    editedAttachments={editedAttachments}
                    onAttachmentsChange={onAttachmentsChange}
                    projectId={projectId}
                    showAttachments={false}
                    onVideoFileStored={onVideoFileStored}
                    onVideoFileRemoved={onVideoFileRemoved}
                />

                {/* Блок «Первый комментарий» — редактор текста комментария */}
                {firstCommentEnabled && mode === 'edit' && (
                    <div className="animate-fade-in-up">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Первый комментарий
                            <span className="text-xs text-gray-400 font-normal ml-1.5">от имени сообщества</span>
                        </label>
                        <CommentTextEditor
                            text={firstCommentText}
                            onTextChange={onFirstCommentTextChange}
                            projectId={projectId}
                            project={currentProject}
                            placeholder="Текст комментария..."
                            rows={3}
                            variables={variables}
                            isLoadingVariables={isLoadingVariables}
                            globalVariables={globalVariables}
                            isLoadingGlobalVariables={isLoadingGlobalVariables}
                            showVariables={false}
                            onEditVariables={() => onOpenProjectSettings('variables')}
                            disabled={isSaving}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
