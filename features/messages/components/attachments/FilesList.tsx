/**
 * Список файлов из переписки.
 */
import React from 'react';
import { AttachmentItem } from '../../hooks/chat/useConversationAttachments';
import { formatAttachmentDate, formatFileSize } from './attachmentsUtils';
import { EmptyCategory } from './EmptyCategory';

interface FilesListProps {
    items: AttachmentItem[];
}

export const FilesList: React.FC<FilesListProps> = ({ items }) => {
    if (items.length === 0) return <EmptyCategory text="Файлов нет" />;

    return (
        <div className="space-y-2 p-3">
            {items.map((item, idx) => (
                <a
                    key={`${item.messageId}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group opacity-0 animate-fade-in-row"
                    style={{ animationDelay: `${idx * 25}ms` }}
                >
                    {/* Иконка файла */}
                    <div className="w-10 h-10 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                            {item.name || 'Документ'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {item.size && (
                                <span className="text-[10px] text-gray-400">{formatFileSize(item.size)}</span>
                            )}
                            <span className="text-[10px] text-gray-300">{formatAttachmentDate(item.messageDate)}</span>
                        </div>
                    </div>
                    {/* Иконка скачивания */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
            ))}
        </div>
    );
};
