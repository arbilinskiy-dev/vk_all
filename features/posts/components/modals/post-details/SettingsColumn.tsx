
import React from 'react';
import { Project } from '../../../../../shared/types';
import { PostCreationOptions } from '../PostCreationOptions';
import { MultiProjectSelector } from '../../MultiProjectSelector';
import { PostDateTimePicker } from '../PostDateTimePicker';

interface SettingsColumnProps {
    // Режим / статус
    isNewPost: boolean;
    isCopyMode: boolean;
    isSaving: boolean;
    saveError: string | null;
    isPublished: boolean;
    // Способ публикации
    publicationMethod: 'system' | 'vk' | 'now';
    onPublicationMethodChange: (method: 'system' | 'vk' | 'now') => void;
    // Закрепление
    isPinned: boolean;
    onTogglePin: (val: boolean) => void;
    // Первый комментарий (только тумблер, не редактор)
    firstCommentEnabled: boolean;
    onToggleFirstComment: (val: boolean) => void;
    onClearFirstCommentText: () => void;
    hasCommunityToken: boolean;
    // Опции создания / цикличность
    isBulkMode: boolean;
    onToggleBulkMode: (val: boolean) => void;
    isMultiProjectMode: boolean;
    onToggleMultiProjectMode: (val: boolean) => void;
    isCyclic: boolean;
    onToggleCyclic: (val: boolean) => void;
    recurrenceInterval: number;
    onRecurrenceIntervalChange: (val: number) => void;
    recurrenceType: string;
    onRecurrenceTypeChange: (val: string) => void;
    recurrenceEndType: string;
    onRecurrenceEndTypeChange: (val: string) => void;
    recurrenceEndCount: number;
    onRecurrenceEndCountChange: (val: number) => void;
    recurrenceEndDate: string;
    onRecurrenceEndDateChange: (val: string) => void;
    recurrenceFixedDay: number | null;
    onRecurrenceFixedDayChange: (val: number | null) => void;
    recurrenceIsLastDay: boolean;
    onRecurrenceIsLastDayChange: (val: boolean) => void;
    // Мультипроект
    allProjects: Project[];
    projectId: string;
    selectedProjectIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    timeShiftEnabled: boolean;
    onToggleTimeShift: () => void;
    timeShiftDays: number;
    timeShiftHours: number;
    timeShiftMinutes: number;
    onTimeShiftDaysChange: (val: number) => void;
    onTimeShiftHoursChange: (val: number) => void;
    onTimeShiftMinutesChange: (val: number) => void;
    orderedProjectIds: string[];
    onReorderProjects: (ids: string[]) => void;
    projectDateTimes: Record<string, { date: string; time: string }>;
    customOverrideIds: Set<string>;
    onSetProjectDateTime: (projectId: string, date: string, time: string) => void;
    onResetProjectDateTime: (projectId: string) => void;
    // Дата/время
    dateSlots: { id: string; date: string; time: string }[];
    onDateSlotChange: (id: string, field: 'date' | 'time', value: string) => void;
    onAddDateSlot: () => void;
    onRemoveDateSlot: (id: string) => void;
    isFutureDate: boolean;
    originalPostDate: string;
    mode: 'view' | 'edit' | 'copy';
    startDate?: string;
}

const buttonBaseClass = 'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
const activeClass = 'bg-white shadow text-indigo-700';
const inactiveClass = 'text-gray-600 hover:bg-gray-100';
const disabledClass = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400';

export const SettingsColumn: React.FC<SettingsColumnProps> = ({
    isNewPost, isCopyMode, isSaving, saveError, isPublished,
    publicationMethod, onPublicationMethodChange,
    isPinned, onTogglePin,
    firstCommentEnabled, onToggleFirstComment, onClearFirstCommentText, hasCommunityToken,
    isBulkMode, onToggleBulkMode,
    isMultiProjectMode, onToggleMultiProjectMode,
    isCyclic, onToggleCyclic,
    recurrenceInterval, onRecurrenceIntervalChange,
    recurrenceType, onRecurrenceTypeChange,
    recurrenceEndType, onRecurrenceEndTypeChange,
    recurrenceEndCount, onRecurrenceEndCountChange,
    recurrenceEndDate, onRecurrenceEndDateChange,
    recurrenceFixedDay, onRecurrenceFixedDayChange,
    recurrenceIsLastDay, onRecurrenceIsLastDayChange,
    allProjects, projectId, selectedProjectIds, onSelectionChange,
    timeShiftEnabled, onToggleTimeShift,
    timeShiftDays, timeShiftHours, timeShiftMinutes,
    onTimeShiftDaysChange, onTimeShiftHoursChange, onTimeShiftMinutesChange,
    orderedProjectIds, onReorderProjects,
    projectDateTimes, customOverrideIds, onSetProjectDateTime, onResetProjectDateTime,
    dateSlots, onDateSlotChange, onAddDateSlot, onRemoveDateSlot,
    isFutureDate, originalPostDate, mode, startDate,
}) => {
    return (
        <div className="w-[30%] border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Настройки</h3>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-5 space-y-4 flex-1 min-h-0">
                {/* Выбор способа публикации */}
                {(isNewPost || isCopyMode) && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Способ публикации</label>
                        <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                            <button onClick={() => onPublicationMethodChange('system')} className={`${buttonBaseClass} ${publicationMethod === 'system' ? activeClass : inactiveClass}`}>Запланировать</button>
                            <button onClick={() => onPublicationMethodChange('vk')} className={`${buttonBaseClass} ${publicationMethod === 'vk' ? activeClass : inactiveClass}`}>В отложку VK</button>
                            <button onClick={() => onPublicationMethodChange('now')} disabled={isFutureDate} className={`${buttonBaseClass} ${publicationMethod === 'now' ? activeClass : inactiveClass} ${disabledClass}`}>Опубликовать сейчас</button>
                        </div>
                    </div>
                )}

                {/* Тумблер «Закрепить на стене» */}
                {publicationMethod !== 'vk' && (
                    <div className="flex items-center gap-3 py-1">
                        <button
                            type="button"
                            onClick={() => onTogglePin(!isPinned)}
                            disabled={isSaving}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${isPinned ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-50`}
                            role="switch"
                            aria-checked={isPinned}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPinned ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span className="text-sm text-gray-700 font-medium">Закрепить на стене</span>
                        </div>
                    </div>
                )}

                {/* Тумблер «Первый комментарий» */}
                {publicationMethod !== 'vk' && hasCommunityToken && (
                    <div className="flex items-center gap-3 py-1">
                        <button
                            type="button"
                            onClick={() => {
                                const newVal = !firstCommentEnabled;
                                onToggleFirstComment(newVal);
                                if (!newVal) onClearFirstCommentText();
                            }}
                            disabled={isSaving}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${firstCommentEnabled ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-50`}
                            role="switch"
                            aria-checked={firstCommentEnabled}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${firstCommentEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm text-gray-700 font-medium">Первый комментарий</span>
                        </div>
                    </div>
                )}

                {/* Опции создания (цикличность, мультипроект) */}
                {((isNewPost || isCopyMode) || publicationMethod === 'system') && (
                    <PostCreationOptions
                        isBulkMode={isBulkMode}
                        onToggleBulkMode={onToggleBulkMode}
                        isMultiProjectMode={isMultiProjectMode}
                        onToggleMultiProjectMode={onToggleMultiProjectMode}
                        isSaving={isSaving}
                        publicationMethod={publicationMethod}
                        isCyclic={isCyclic}
                        onToggleCyclic={onToggleCyclic}
                        recurrenceInterval={recurrenceInterval}
                        onRecurrenceIntervalChange={onRecurrenceIntervalChange}
                        recurrenceType={recurrenceType}
                        onRecurrenceTypeChange={onRecurrenceTypeChange}
                        recurrenceEndType={recurrenceEndType}
                        onRecurrenceEndTypeChange={onRecurrenceEndTypeChange}
                        recurrenceEndCount={recurrenceEndCount}
                        onRecurrenceEndCountChange={onRecurrenceEndCountChange}
                        recurrenceEndDate={recurrenceEndDate}
                        onRecurrenceEndDateChange={onRecurrenceEndDateChange}
                        recurrenceFixedDay={recurrenceFixedDay}
                        onRecurrenceFixedDayChange={onRecurrenceFixedDayChange}
                        recurrenceIsLastDay={recurrenceIsLastDay}
                        onRecurrenceIsLastDayChange={onRecurrenceIsLastDayChange}
                        allowBulkMode={isNewPost || isCopyMode}
                        startDate={startDate}
                    />
                )}

                {/* Мультипроект */}
                {isMultiProjectMode && (
                    <MultiProjectSelector 
                        allProjects={allProjects} 
                        selectedIds={selectedProjectIds} 
                        currentProjectId={projectId} 
                        onSelectionChange={onSelectionChange}
                        timeShiftEnabled={timeShiftEnabled}
                        onToggleTimeShift={onToggleTimeShift}
                        timeShiftDays={timeShiftDays}
                        timeShiftHours={timeShiftHours}
                        timeShiftMinutes={timeShiftMinutes}
                        onTimeShiftDaysChange={onTimeShiftDaysChange}
                        onTimeShiftHoursChange={onTimeShiftHoursChange}
                        onTimeShiftMinutesChange={onTimeShiftMinutesChange}
                        orderedProjectIds={orderedProjectIds}
                        onReorderProjects={onReorderProjects}
                        projectDateTimes={projectDateTimes}
                        customOverrideIds={customOverrideIds}
                        onSetProjectDateTime={onSetProjectDateTime}
                        onResetProjectDateTime={onResetProjectDateTime}
                    />
                )}

                <PostDateTimePicker
                    isBulkMode={isBulkMode}
                    dateSlots={dateSlots}
                    onDateSlotChange={onDateSlotChange}
                    onAddDateSlot={onAddDateSlot}
                    onRemoveDateSlot={onRemoveDateSlot}
                    isPublished={isPublished}
                    isNewOrCopy={isNewPost || isCopyMode}
                    mode={mode}
                    publicationMethod={publicationMethod}
                    isFutureDate={isFutureDate}
                    originalPostDate={originalPostDate}
                />

                {saveError && <p className="text-red-600 text-sm mt-2">{saveError}</p>}
            </div>
        </div>
    );
};
