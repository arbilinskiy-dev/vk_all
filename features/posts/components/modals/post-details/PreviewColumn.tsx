
import React from 'react';
import { PhotoAttachment, Attachment, GlobalVariableDefinition, ProjectGlobalVariableValue } from '../../../../../shared/types';
import { PostPreview } from '../PostPreview';
import { TimeShiftSummaryItem } from './useTimeShiftSummary';

interface PreviewColumnProps {
    editedText: string;
    editedImages: PhotoAttachment[];
    editedAttachments: Attachment[];
    dateSlot: { id: string; date: string; time: string } | undefined;
    projectName?: string;
    projectAvatar?: string;
    isPinned: boolean;
    globalVariables: GlobalVariableDefinition[] | null;
    globalVariableValues: ProjectGlobalVariableValue[];
    firstCommentText?: string;
    timeShiftSummary?: TimeShiftSummaryItem[];
}

export const PreviewColumn: React.FC<PreviewColumnProps> = ({
    editedText, editedImages, editedAttachments, dateSlot,
    projectName, projectAvatar, isPinned,
    globalVariables, globalVariableValues,
    firstCommentText, timeShiftSummary,
}) => {
    return (
        <div className="w-[20%] flex flex-col overflow-hidden bg-gray-50/50">
            <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Предпросмотр</h3>
                {isPinned && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Закреплён
                    </div>
                )}
            </div>
            <div className="overflow-y-auto custom-scrollbar p-4 flex-1">
                <PostPreview
                    text={editedText}
                    images={editedImages}
                    attachments={editedAttachments}
                    dateSlot={dateSlot}
                    projectName={projectName}
                    projectAvatar={projectAvatar}
                    isPinned={isPinned}
                    globalVariables={globalVariables}
                    globalVariableValues={globalVariableValues}
                    firstCommentText={firstCommentText}
                />
            </div>
            {/* Сводка мультипроектной публикации */}
            {timeShiftSummary && timeShiftSummary.length > 1 && (
                <div className="flex-shrink-0 border-t border-gray-200 p-3">
                    <div className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider mb-1.5">
                        Будет запланировано ({timeShiftSummary.length})
                    </div>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                        {timeShiftSummary.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                                <span className="text-gray-600 truncate mr-2">{item.projectName}</span>
                                <span className="text-indigo-600 font-mono whitespace-nowrap">{item.dateTime}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
