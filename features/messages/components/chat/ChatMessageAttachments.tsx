/**
 * Компоненты рендеринга вложений чат-сообщения.
 * Стикер, видео, голосовое сообщение, документ, ссылка, запись,
 * опрос, граффити, подарок, товар, неизвестный тип + роутер.
 */
import React, { useState } from 'react';
import { MessageAttachment } from '../../types';
import { formatDuration, formatAudioDuration, formatSize } from './chatMessageUtils';

// =============================================================================
// КОМПОНЕНТЫ ВЛОЖЕНИЙ
// =============================================================================

/** Стикер — без фона бабла */
const StickerAttachment: React.FC<{ att: MessageAttachment }> = ({ att }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative w-32 h-32">
            {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md" />}
            <img
                src={att.previewUrl || att.url}
                alt="Стикер"
                className={`w-32 h-32 object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
};

/** Видео — превью + иконка play */
const VideoAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="rounded-md overflow-hidden w-full relative">
            {att.previewUrl ? (
                <>
                    {!loaded && <div className="w-full h-[160px] bg-gray-200 animate-pulse rounded-md" />}
                    <img
                        src={att.previewUrl}
                        alt={att.name || 'Видео'}
                        className={`rounded-md w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                        onLoad={() => setLoaded(true)}
                    />
                </>
            ) : (
                <div className="w-full h-[120px] bg-gray-700 rounded-md flex items-center justify-center" />
            )}
            {/* Иконка Play */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
            {/* Длительность + название */}
            <div className="absolute bottom-1 left-1 right-1 flex items-end justify-between">
                {att.duration != null && (
                    <span className="text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">{formatDuration(att.duration)}</span>
                )}
            </div>
            {att.name && (
                <p className={`text-xs mt-1 truncate ${isOutgoing ? 'text-indigo-200' : 'text-gray-500'}`}>{att.name}</p>
            )}
        </div>
    );
};

/** Голосовое сообщение */
const AudioMessageAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${isOutgoing ? 'bg-indigo-500/30' : 'bg-gray-200'}`}>
            {/* Иконка микрофона */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 ${isOutgoing ? 'text-white' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {/* Волна (стилизация) */}
            <div className="flex-1 flex items-center gap-[2px] h-4">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-[3px] rounded-full ${isOutgoing ? 'bg-white/50' : 'bg-indigo-300'}`}
                        style={{ height: `${4 + Math.sin(i * 0.8) * 8 + Math.random() * 4}px` }}
                    />
                ))}
            </div>
            <span className={`text-xs flex-shrink-0 ${isOutgoing ? 'text-indigo-200' : 'text-gray-500'}`}>
                {formatAudioDuration(att.duration)}
            </span>
        </div>
    );
};

/** Документ */
const DocumentAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => {
    return (
        <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
                isOutgoing ? 'bg-indigo-500/30 hover:bg-indigo-500/40' : 'bg-gray-200 hover:bg-gray-300'
            }`}
        >
            {/* Иконка файла */}
            <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${isOutgoing ? 'bg-indigo-400/30' : 'bg-indigo-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isOutgoing ? 'text-white' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isOutgoing ? 'text-white' : 'text-gray-800'}`}>
                    {att.name || 'Документ'}
                </p>
                {att.size && (
                    <p className={`text-xs ${isOutgoing ? 'text-indigo-200' : 'text-gray-400'}`}>{formatSize(att.size)}</p>
                )}
            </div>
            {/* Иконка скачивания */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${isOutgoing ? 'text-indigo-200' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>
    );
};

/** Ссылка — карточка превью */
const LinkAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-md overflow-hidden border transition-colors ${
                isOutgoing ? 'border-indigo-400/30 hover:border-indigo-400/50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            {att.previewUrl && (
                <div className="relative">
                    {!imgLoaded && <div className="w-full h-[120px] bg-gray-200 animate-pulse" />}
                    <img
                        src={att.previewUrl}
                        alt={att.name || ''}
                        className={`w-full max-h-[140px] object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                        onLoad={() => setImgLoaded(true)}
                    />
                </div>
            )}
            <div className={`px-3 py-2 ${isOutgoing ? 'bg-indigo-500/20' : 'bg-gray-50'}`}>
                {att.name && (
                    <p className={`text-sm font-medium truncate ${isOutgoing ? 'text-white' : 'text-gray-800'}`}>{att.name}</p>
                )}
                {att.description && (
                    <p className={`text-xs mt-0.5 line-clamp-2 ${isOutgoing ? 'text-indigo-200' : 'text-gray-500'}`}>{att.description}</p>
                )}
                <p className={`text-[11px] mt-1 truncate ${isOutgoing ? 'text-indigo-300' : 'text-gray-400'}`}>
                    {new URL(att.url).hostname}
                </p>
            </div>
        </a>
    );
};

/** Запись со стены */
const WallAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => (
    <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-start gap-2 px-3 py-2 rounded-md transition-colors ${
            isOutgoing ? 'bg-indigo-500/30 hover:bg-indigo-500/40' : 'bg-gray-200 hover:bg-gray-300'
        }`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isOutgoing ? 'text-white' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${isOutgoing ? 'text-white' : 'text-gray-800'}`}>{att.name || 'Запись'}</p>
            {att.description && (
                <p className={`text-xs mt-0.5 line-clamp-2 ${isOutgoing ? 'text-indigo-200' : 'text-gray-500'}`}>{att.description}</p>
            )}
        </div>
    </a>
);

/** Опрос */
const PollAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => (
    <div className={`rounded-md px-3 py-2.5 ${isOutgoing ? 'bg-indigo-500/30' : 'bg-gray-200'}`}>
        <div className="flex items-center gap-1.5 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isOutgoing ? 'text-white' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className={`text-sm font-medium ${isOutgoing ? 'text-white' : 'text-gray-800'}`}>{att.name || 'Опрос'}</p>
        </div>
        {att.pollAnswers && att.pollAnswers.length > 0 && (
            <div className="space-y-1">
                {att.pollAnswers.map((answer, i) => (
                    <div key={i} className={`text-xs px-2 py-1 rounded ${isOutgoing ? 'bg-indigo-400/20 text-indigo-100' : 'bg-white text-gray-600'}`}>
                        {answer.text}
                    </div>
                ))}
            </div>
        )}
    </div>
);

/** Граффити */
const GraffitiAttachment: React.FC<{ att: MessageAttachment }> = ({ att }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative max-w-[200px]">
            {!loaded && <div className="w-[200px] h-[100px] bg-gray-100 animate-pulse rounded-md" />}
            <img
                src={att.url}
                alt="Граффити"
                className={`max-w-full rounded-md transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
};

/** Подарок */
const GiftAttachment: React.FC<{ att: MessageAttachment }> = ({ att }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="text-center">
            <div className="relative w-24 h-24 mx-auto">
                {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md" />}
                {att.previewUrl && (
                    <img
                        src={att.previewUrl}
                        alt="Подарок"
                        className={`w-24 h-24 object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setLoaded(true)}
                    />
                )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Подарок</p>
        </div>
    );
};

/** Товар */
const MarketAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    return (
        <div className={`rounded-md overflow-hidden border ${isOutgoing ? 'border-indigo-400/30' : 'border-gray-200'}`}>
            {att.previewUrl && (
                <div className="relative">
                    {!imgLoaded && <div className="w-full h-[100px] bg-gray-200 animate-pulse" />}
                    <img
                        src={att.previewUrl}
                        alt={att.name || 'Товар'}
                        className={`w-full max-h-[120px] object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                        onLoad={() => setImgLoaded(true)}
                    />
                </div>
            )}
            <div className={`px-3 py-2 ${isOutgoing ? 'bg-indigo-500/20' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium truncate ${isOutgoing ? 'text-white' : 'text-gray-800'}`}>{att.name || 'Товар'}</p>
                {att.description && (
                    <p className={`text-xs font-semibold mt-0.5 ${isOutgoing ? 'text-indigo-200' : 'text-indigo-600'}`}>{att.description}</p>
                )}
            </div>
        </div>
    );
};

/** Неизвестный тип вложения */
const UnknownAttachment: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${isOutgoing ? 'bg-indigo-500/30 text-indigo-200' : 'bg-gray-200 text-gray-500'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {att.name || 'Вложение'}
    </div>
);

// =============================================================================
// РОУТЕР ВЛОЖЕНИЙ
// =============================================================================

/** Роутер рендера вложения по типу (кроме фото — они рендерятся через PhotoGrid) */
export const AttachmentRenderer: React.FC<{ att: MessageAttachment; isOutgoing: boolean }> = ({ att, isOutgoing }) => {
    switch (att.type) {
        case 'sticker': return <StickerAttachment att={att} />;
        case 'video': return <VideoAttachment att={att} isOutgoing={isOutgoing} />;
        case 'audio_message': return <AudioMessageAttachment att={att} isOutgoing={isOutgoing} />;
        case 'document': return <DocumentAttachment att={att} isOutgoing={isOutgoing} />;
        case 'link': return <LinkAttachment att={att} isOutgoing={isOutgoing} />;
        case 'wall': return <WallAttachment att={att} isOutgoing={isOutgoing} />;
        case 'poll': return <PollAttachment att={att} isOutgoing={isOutgoing} />;
        case 'graffiti': return <GraffitiAttachment att={att} />;
        case 'gift': return <GiftAttachment att={att} />;
        case 'market': return <MarketAttachment att={att} isOutgoing={isOutgoing} />;
        default: return <UnknownAttachment att={att} isOutgoing={isOutgoing} />;
    }
};
