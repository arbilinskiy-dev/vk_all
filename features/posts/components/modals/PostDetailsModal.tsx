

import React, { useState } from 'react';
import { Project, ScheduledPost, SystemPost } from '../../../../shared/types';
import { UnifiedPost } from '../../../schedule/hooks/useScheduleData';
import { usePostDetails } from '../../hooks/usePostDetails';
import { SlidePanel } from '../../../../shared/components/modals/SlidePanel';
import { AIGenerator } from '../AIGenerator';
import { PostPreview } from './PostPreview';
import { PostModalFooter } from './PostModalFooter';

// Подкомпоненты из post-details/
import { ContestV2PostModal } from './post-details/ContestV2PostModal';
import { SettingsColumn } from './post-details/SettingsColumn';
import { ContentColumn } from './post-details/ContentColumn';
import { PreviewColumn } from './post-details/PreviewColumn';
import { PostDetailsModals } from './post-details/PostDetailsModals';
import { useProjectSettings } from './post-details/useProjectSettings';
import { useTimeShiftSummary } from './post-details/useTimeShiftSummary';

export type RefreshType = 'system' | 'scheduled' | 'published';

export const PostDetailsModal: React.FC<{
    post: UnifiedPost;
    isPublished: boolean;
    projectId: string;
    allProjects: Project[];
    onClose: () => void;
    onSaveComplete: (affectedProjectIds: string[], refreshType: RefreshType) => void;
    onDelete: (post: ScheduledPost | SystemPost) => void;
    onPublishNow: (post: ScheduledPost | SystemPost) => void;
    onUpdateProject: (updatedProject: Project) => Promise<void>;
    initialMode?: 'view' | 'edit' | 'copy';
    // Для постов Конкурс 2.0
    onGoToContestSettings?: (contestId: string, projectId: string) => void;
}> = (props) => {
    
    // Проверяем, является ли это постом Конкурс 2.0
    const isContestV2Post = props.post.postType === 'system' && 
        'post_type' in props.post && 
        props.post.post_type === 'contest_v2_start';
    
    // Если это пост Конкурс 2.0 — показываем специальное модальное окно
    if (isContestV2Post && 'related_id' in props.post && props.post.related_id) {
        const contestId = props.post.related_id;
        return (
            <ContestV2PostModal 
                post={props.post}
                onClose={props.onClose}
                onGoToSettings={() => {
                    props.onClose();
                    props.onGoToContestSettings?.(contestId, props.projectId);
                }}
            />
        );
    }
    
    // Состояние для модалки массового редактирования
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    
    // Вся логика теперь в хуке
    const { state, actions } = usePostDetails(props);

    const {
        formPost, mode, isNewPost, isCopyMode, isSaving, saveError,
        showUnsavedChangesConfirm, isLocked, isUploadingMedia, modalTitle, totalPostCount, formState,
        showAIGenerator, showVariables, variables, isLoadingVariables, globalVariables, isLoadingGlobalVariables, globalVariableValues,
        reuploadRetryInfo, isRetrying,
    } = state;
    
    const {
        handleClose, handleSave, handlePublishNowClick, handleDeleteClick,
        switchToEditMode, confirmClose, cancelClose, setIsUploadingMedia, formActions,
        setShowAIGenerator, handleToggleVariables, handleReloadVariables,
        storeVideoFile, removeVideoFile,
        handleRetryReupload, handleSkipFailedReupload,
    } = actions;

    const {
        publicationMethod, editedText, editedImages, editedAttachments,
        isBulkMode, dateSlots, isMultiProjectMode, selectedProjectIds,
        isDirty, isFutureDate, isCyclic, recurrenceInterval, recurrenceType,
        recurrenceEndType, recurrenceEndCount, recurrenceEndDate,
        recurrenceFixedDay, recurrenceIsLastDay,
        isPinned,
        firstCommentEnabled, firstCommentText,
        isAiMultiMode, selectedAiTurn,
        timeShiftEnabled, timeShiftDays, timeShiftHours, timeShiftMinutes, orderedProjectIds,
        projectDateTimes, customOverrideIds
    } = formState;
    
    const {
        setPublicationMethod, setEditedText, setEditedImages, setEditedAttachments,
        setIsBulkMode, setIsMultiProjectMode, setSelectedProjectIds,
        handleAddDateSlot, handleRemoveDateSlot, handleDateSlotChange,
        setIsCyclic, setRecurrenceInterval, setRecurrenceType,
        setRecurrenceEndType, setRecurrenceEndCount, setRecurrenceEndDate,
        setRecurrenceFixedDay, setRecurrenceIsLastDay,
        setIsPinned,
        setFirstCommentEnabled, setFirstCommentText,
        setIsAiMultiMode, setSelectedAiTurn,
        handleToggleTimeShift, setTimeShiftDays, setTimeShiftHours, setTimeShiftMinutes, reorderProjects,
        setProjectDateTime, resetProjectDateTime
    } = formActions;

    // Хук управления настройками проекта
    const projectSettings = useProjectSettings({
        allProjects: props.allProjects,
        projectId: props.projectId,
        showVariables,
        onUpdateProject: props.onUpdateProject,
        onReloadVariables: handleReloadVariables,
    });

    // Сводка расписания для мультипроектной публикации
    const timeShiftSummary = useTimeShiftSummary({
        isMultiProjectMode, isBulkMode, selectedProjectIds, orderedProjectIds,
        projectDateTimes, dateSlots, allProjects: props.allProjects,
    });

    return (
        <>
            <SlidePanel isOpen={true} onClose={handleClose} width={mode === 'view' ? '40vw' : undefined}>
                    <header className="p-4 border-b flex items-center flex-shrink-0">
                        <h2 className="text-lg font-semibold text-gray-800">{modalTitle}</h2>
                    </header>
                    
                    {mode === 'edit' ? (
                        /* ====== 4-КОЛОНОЧНЫЙ LAYOUT ДЛЯ РЕЖИМА РЕДАКТИРОВАНИЯ ====== */
                        <div className="flex flex-1 overflow-hidden">
                            {/* Колонка 1: Настройки */}
                            <SettingsColumn
                                isNewPost={isNewPost}
                                isCopyMode={isCopyMode}
                                isSaving={isSaving}
                                saveError={saveError}
                                isPublished={props.isPublished}
                                publicationMethod={publicationMethod}
                                onPublicationMethodChange={setPublicationMethod}
                                isPinned={isPinned}
                                onTogglePin={setIsPinned}
                                firstCommentEnabled={firstCommentEnabled}
                                onToggleFirstComment={setFirstCommentEnabled}
                                onClearFirstCommentText={() => setFirstCommentText('')}
                                hasCommunityToken={Boolean(projectSettings.currentProject?.communityToken)}
                                isBulkMode={isBulkMode}
                                onToggleBulkMode={setIsBulkMode}
                                isMultiProjectMode={isMultiProjectMode}
                                onToggleMultiProjectMode={setIsMultiProjectMode}
                                isCyclic={isCyclic}
                                onToggleCyclic={setIsCyclic}
                                recurrenceInterval={recurrenceInterval}
                                onRecurrenceIntervalChange={setRecurrenceInterval}
                                recurrenceType={recurrenceType}
                                onRecurrenceTypeChange={setRecurrenceType}
                                recurrenceEndType={recurrenceEndType}
                                onRecurrenceEndTypeChange={setRecurrenceEndType}
                                recurrenceEndCount={recurrenceEndCount}
                                onRecurrenceEndCountChange={setRecurrenceEndCount}
                                recurrenceEndDate={recurrenceEndDate}
                                onRecurrenceEndDateChange={setRecurrenceEndDate}
                                recurrenceFixedDay={recurrenceFixedDay}
                                onRecurrenceFixedDayChange={setRecurrenceFixedDay}
                                recurrenceIsLastDay={recurrenceIsLastDay}
                                onRecurrenceIsLastDayChange={setRecurrenceIsLastDay}
                                allProjects={props.allProjects}
                                projectId={props.projectId}
                                selectedProjectIds={selectedProjectIds}
                                onSelectionChange={setSelectedProjectIds}
                                timeShiftEnabled={timeShiftEnabled}
                                onToggleTimeShift={handleToggleTimeShift}
                                timeShiftDays={timeShiftDays}
                                timeShiftHours={timeShiftHours}
                                timeShiftMinutes={timeShiftMinutes}
                                onTimeShiftDaysChange={setTimeShiftDays}
                                onTimeShiftHoursChange={setTimeShiftHours}
                                onTimeShiftMinutesChange={setTimeShiftMinutes}
                                orderedProjectIds={orderedProjectIds}
                                onReorderProjects={reorderProjects}
                                projectDateTimes={projectDateTimes}
                                customOverrideIds={customOverrideIds}
                                onSetProjectDateTime={setProjectDateTime}
                                onResetProjectDateTime={resetProjectDateTime}
                                dateSlots={dateSlots}
                                onDateSlotChange={handleDateSlotChange}
                                onAddDateSlot={handleAddDateSlot}
                                onRemoveDateSlot={handleRemoveDateSlot}
                                isFutureDate={isFutureDate}
                                originalPostDate={formPost.date}
                                mode={mode}
                                startDate={dateSlots[0]?.date}
                            />

                            {/* Колонка 2: AI-помощник */}
                            <div className="w-[25%] border-r border-gray-200 flex flex-col overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-200 flex-shrink-0">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI-помощник</h3>
                                </div>
                                <AIGenerator
                                    projectId={props.projectId}
                                    postText={editedText}
                                    onTextGenerated={(text) => setEditedText(editedText ? `${editedText}\n\n${text}` : text)}
                                    onReplacePostText={(text) => setEditedText(text)}
                                    onEditPresets={() => projectSettings.handleOpenProjectSettings('ai-presets')}
                                    refreshKey={projectSettings.aiPresetsRefreshKey}
                                    isMultiGenerationMode={isAiMultiMode}
                                    onSelectionChange={setSelectedAiTurn}
                                    fillParent={true}
                                />
                            </div>

                            {/* Колонка 3: Контент */}
                            <ContentColumn
                                mode={mode}
                                postText={formPost.text}
                                editedText={editedText}
                                onTextChange={setEditedText}
                                editedImages={editedImages}
                                onImagesChange={setEditedImages}
                                editedAttachments={editedAttachments}
                                onAttachmentsChange={setEditedAttachments}
                                formPostAttachments={formPost.attachments || []}
                                onUploadStateChange={setIsUploadingMedia}
                                onVideoFileStored={storeVideoFile}
                                onVideoFileRemoved={removeVideoFile}
                                projectId={props.projectId}
                                allProjects={props.allProjects}
                                currentProject={projectSettings.currentProject}
                                showVariables={showVariables}
                                onToggleVariables={handleToggleVariables}
                                onReloadVariables={handleReloadVariables}
                                variables={variables}
                                isLoadingVariables={isLoadingVariables}
                                globalVariables={globalVariables}
                                isLoadingGlobalVariables={isLoadingGlobalVariables}
                                onOpenProjectSettings={projectSettings.handleOpenProjectSettings}
                                firstCommentEnabled={firstCommentEnabled}
                                firstCommentText={firstCommentText}
                                onFirstCommentTextChange={setFirstCommentText}
                                isSaving={isSaving}
                            />

                            {/* Колонка 4: Предпросмотр */}
                            <PreviewColumn
                                editedText={editedText}
                                editedImages={editedImages}
                                editedAttachments={editedAttachments}
                                dateSlot={dateSlots[0]}
                                projectName={projectSettings.currentProject?.vkGroupName || projectSettings.currentProject?.name}
                                projectAvatar={projectSettings.currentProject?.avatar_url || undefined}
                                isPinned={isPinned}
                                globalVariables={globalVariables}
                                globalVariableValues={globalVariableValues}
                                firstCommentText={firstCommentEnabled ? firstCommentText : undefined}
                                timeShiftSummary={timeShiftSummary}
                            />
                        </div>
                    ) : (
                        /* ====== КОМПАКТНЫЙ ПРЕДПРОСМОТР В СТИЛЕ VK ====== */
                        <main className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <PostPreview
                                text={editedText}
                                images={editedImages}
                                attachments={editedAttachments}
                                dateSlot={dateSlots[0]}
                                projectName={projectSettings.currentProject?.vkGroupName || projectSettings.currentProject?.name}
                                projectAvatar={projectSettings.currentProject?.avatar_url || undefined}
                                isPinned={isPinned}
                                globalVariables={globalVariables}
                                globalVariableValues={globalVariableValues}
                                firstCommentText={firstCommentEnabled ? firstCommentText : undefined}
                            />
                        </main>
                    )}

                    <PostModalFooter
                        mode={mode}
                        isNewPost={isNewPost}
                        isCopyMode={isCopyMode}
                        isPublished={props.isPublished}
                        isDirty={isDirty}
                        isSaving={isSaving}
                        isUploading={isUploadingMedia}
                        isLocked={isLocked}
                        editedText={editedText}
                        editedImages={editedImages}
                        editedAttachments={editedAttachments}
                        publicationMethod={publicationMethod}
                        postCount={totalPostCount}
                        onSave={handleSave}
                        onDelete={handleDeleteClick}
                        onPublishNow={handlePublishNowClick}
                        onSwitchToEdit={switchToEditMode}
                        isAiMultiMode={isAiMultiMode}
                        selectedAiTurn={selectedAiTurn}
                        timeShiftSummary={timeShiftSummary}
                        showBulkEditButton={props.allProjects.length > 1}
                        onBulkEdit={() => setShowBulkEditModal(true)}
                    />
            </SlidePanel>

            <PostDetailsModals
                showUnsavedChangesConfirm={showUnsavedChangesConfirm}
                onConfirmClose={confirmClose}
                onCancelClose={cancelClose}
                reuploadRetryInfo={reuploadRetryInfo}
                isRetrying={isRetrying}
                onRetryReupload={handleRetryReupload}
                onSkipFailedReupload={handleSkipFailedReupload}
                showBulkEditModal={showBulkEditModal}
                onCloseBulkEdit={() => setShowBulkEditModal(false)}
                sourcePost={props.post}
                allProjects={props.allProjects}
                onSaveComplete={props.onSaveComplete}
                isProjectSettingsOpen={projectSettings.isProjectSettingsOpen}
                onCloseProjectSettings={() => projectSettings.setIsProjectSettingsOpen(false)}
                currentProject={projectSettings.currentProject}
                uniqueTeams={projectSettings.uniqueTeams}
                onSaveProjectSettings={projectSettings.handleSaveProjectSettings}
                settingsInitialSection={projectSettings.settingsInitialSection}
            />
        </>
    );
};
