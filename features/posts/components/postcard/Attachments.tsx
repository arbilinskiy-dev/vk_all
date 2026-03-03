import React from 'react';
import { Attachment } from '../../../../shared/types';

const AttachmentIcon: React.FC<{ type: Attachment['type'] }> = ({ type }) => {
    switch (type) {
        case 'video':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
        case 'poll':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
        case 'doc':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'audio':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>;
        case 'link':
             return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
        default:
            return null;
    }
};

// Компактная миниатюра видео для карточки поста
const VideoThumbnail: React.FC<{ att: Attachment }> = ({ att }) => {
    return (
        <div className="rounded overflow-hidden bg-gray-100">
            {att.thumbnail_url ? (
                <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
                    <img src={att.thumbnail_url} alt={att.description || 'Видео'} className="w-full h-full object-cover" />
                    {/* Иконка Play по центру */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    {/* Название видео внизу */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                        <p className="text-[10px] text-white truncate">{att.description}</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 p-1.5">
                    <div className="flex-shrink-0"><AttachmentIcon type="video" /></div>
                    <p className="text-xs text-gray-500 truncate" title={att.description}>{att.description}</p>
                </div>
            )}
        </div>
    );
};

export const AttachmentsDisplay: React.FC<{ attachments: Attachment[] }> = React.memo(({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;

    // Разделяем: опросы отдельно для стилизации
    const polls = attachments.filter(a => a.type === 'poll');
    const others = attachments.filter(a => a.type !== 'poll');

    return (
        <div className="mt-2 space-y-1">
            {/* Опросы — компактный индикатор с фиолетовым акцентом */}
            {polls.map((att) => (
                <div key={att.id} className="flex items-center gap-1.5 text-purple-600 bg-purple-50 border border-purple-200 p-1.5 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-medium truncate">
                        {att.poll_data?.question || att.description || 'Опрос'}
                    </span>
                </div>
            ))}
            
            {/* Остальные вложения */}
            {others.map((att) => (
                att.type === 'video' ? (
                    <VideoThumbnail key={att.id} att={att} />
                ) : (
                    <div key={att.id} className="flex items-center text-gray-500 bg-gray-100 p-1 rounded">
                        <div className="flex-shrink-0"><AttachmentIcon type={att.type} /></div>
                        <p className="ml-2 text-xs truncate" title={att.description}>{att.description}</p>
                    </div>
                )
            ))}
        </div>
    );
});