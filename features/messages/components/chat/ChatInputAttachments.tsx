/**
 * Превью прикреплённых файлов (фото/видео) для ChatInput.
 */

import React from 'react';
import { AttachedFile } from './chatInputConstants';

interface ChatInputAttachmentsProps {
    attachedFiles: AttachedFile[];
    onRemoveFile: (fileId: string) => void;
}

export const ChatInputAttachments: React.FC<ChatInputAttachmentsProps> = ({
    attachedFiles,
    onRemoveFile,
}) => {
    if (attachedFiles.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap px-2.5 py-2 bg-gray-50 border-b border-gray-200">
            {attachedFiles.map(file => (
                <div key={file.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    {file.type === 'photo' ? (
                        <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : file.type === 'video' ? (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    ) : (
                        /* Документ — иконка файла + расширение */
                        <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center p-1">
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-[8px] text-blue-600 font-medium mt-0.5 truncate w-full text-center">
                                {file.file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                            </span>
                        </div>
                    )}
                    {/* Кнопка удаления файла */}
                    <button
                        type="button"
                        onClick={() => onRemoveFile(file.id)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {/* Бейдж типа для видео */}
                    {file.type === 'video' && (
                        <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                            видео
                        </span>
                    )}
                    {file.type === 'document' && (
                        <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-blue-500/80 text-white px-1 rounded truncate max-w-[56px]" title={file.file.name}>
                            {file.file.name.length > 8 ? file.file.name.substring(0, 6) + '…' : file.file.name}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};
