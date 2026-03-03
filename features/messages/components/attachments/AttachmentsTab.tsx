/**
 * Вкладка «Вложения» в панели информации о пользователе (UserInfoPanel).
 * ХАБ-КОНТЕЙНЕР: подкомпоненты и утилиты вынесены в отдельные файлы.
 * 
 * Показывает все вложения из переписки, сгруппированные по категориям:
 * Фото / Видео / Ссылки / Файлы.
 */

import React, { useState } from 'react';
import { ChatMessageData } from '../../types';
import { useConversationAttachments } from '../../hooks/chat/useConversationAttachments';
import { ImagePreviewModal } from '../../../../shared/components/modals/ImagePreviewModal';
import { SUB_TABS, SubTab } from './attachmentsConstants';
// Файл переименован в .tsx для поддержки JSX (svg-иконки)
import { PhotosGrid } from './PhotosGrid';
import { VideosList } from './VideosList';
import { LinksList } from './LinksList';
import { FilesList } from './FilesList';

// =============================================================================
// ТИПЫ
// =============================================================================

interface AttachmentsTabProps {
    /** Загруженные сообщения (из useMessageHistory) */
    messages: ChatMessageData[];
    /** Загружены ли все сообщения из истории */
    isFullyLoaded: boolean;
    /** Идёт загрузка всех сообщений */
    isLoadingAll: boolean;
    /** Колбэк загрузки всех сообщений */
    onLoadAll: () => void;
    /** Количество загруженных сообщений */
    loadedMessagesCount: number;
}

// =============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// =============================================================================

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
    messages,
    isFullyLoaded,
    isLoadingAll,
    onLoadAll,
    loadedMessagesCount,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('photos');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Группировка вложений через хук
    const { photos, videos, links, files, totalCount } = useConversationAttachments({ messages });

    // Счётчики для бейджей на вкладках
    const counts: Record<SubTab, number> = {
        photos: photos.length,
        videos: videos.length,
        links: links.length,
        files: files.length,
    };

    return (
        <div className="flex-1 h-full flex flex-col overflow-hidden animate-fade-in">

            {/* Плашка «Загрузите всю историю» (если история загружена не полностью) */}
            {!isFullyLoaded && (
                <div className="mx-3 mt-3 mb-1 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[11px] text-amber-700 leading-snug">
                        Показаны вложения из <span className="font-semibold">{loadedMessagesCount}</span> загруженных сообщений.
                        Загрузите всю историю для полного списка.
                    </p>
                    <button
                        onClick={onLoadAll}
                        disabled={isLoadingAll}
                        className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
                    >
                        {isLoadingAll ? (
                            <>
                                <div className="loader h-3 w-3 border-2 border-amber-300 border-t-amber-600"></div>
                                Загрузка...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Загрузить все сообщения
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Подкатегории: Фото / Видео / Ссылки / Файлы — underline табы */}
            <div className="px-2 pt-1 bg-white border-b border-gray-200">
                <div className="flex gap-4">
                    {SUB_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveSubTab(tab.key)}
                            className={`flex items-center gap-1 py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                                activeSubTab === tab.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}{counts[tab.key] > 0 ? ` - ${counts[tab.key]}` : ''}
                        </button>
                    ))}
                </div>
            </div>

            {/* Контент подкатегории */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeSubTab === 'photos' && <PhotosGrid items={photos} onPreview={setPreviewImage} />}
                {activeSubTab === 'videos' && <VideosList items={videos} />}
                {activeSubTab === 'links' && <LinksList items={links} />}
                {activeSubTab === 'files' && <FilesList items={files} />}
            </div>

            {/* Итого */}
            {totalCount > 0 && (
                <div className="px-3 py-2 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-300">
                        Всего вложений: {totalCount}
                        {isFullyLoaded && ' · вся история загружена'}
                    </p>
                </div>
            )}

            {/* Модал превью фото */}
            {previewImage && (
                <ImagePreviewModal
                    image={{ id: 'att-preview', url: previewImage }}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </div>
    );
};
