
import React from 'react';

interface VideoUploadCardProps {
    isVideoUploading: boolean;
    videoUploadError: string | null;
    onCancelUpload: () => void;
}

// Карточка загрузки видео + отображение ошибки загрузки
export const VideoUploadCard: React.FC<VideoUploadCardProps> = ({
    isVideoUploading,
    videoUploadError,
    onCancelUpload,
}) => {
    return (
        <>
            {/* Карточка загрузки видео */}
            {isVideoUploading && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2 animate-fade-in-up">
                    {/* Миниатюра-заглушка с пульсацией */}
                    <div className="relative w-[56px] h-[40px] flex-shrink-0 bg-blue-100 rounded overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                        </div>
                    </div>
                    {/* Текст и прогресс-бар */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-800 truncate">Загрузка видео…</p>
                        <p className="text-[11px] text-blue-500 mt-0.5">Отправка файла в ВК</p>
                        {/* Анимированный прогресс-бар (неопределённый) */}
                        <div className="mt-1.5 h-1 w-full bg-blue-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" 
                                 style={{ width: '40%', animationName: 'indeterminate' }} />
                        </div>
                    </div>
                    {/* Кнопка отмены загрузки */}
                    <button
                        type="button"
                        onClick={onCancelUpload}
                        className="flex-shrink-0 p-1.5 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Отменить загрузку"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
            {/* Ошибка загрузки видео */}
            {videoUploadError && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-2 animate-fade-in-up">
                    <div className="relative w-[56px] h-[40px] flex-shrink-0 bg-red-100 rounded flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-700">Ошибка загрузки видео</p>
                        <p className="text-[11px] text-red-500 mt-0.5 truncate">{videoUploadError}</p>
                    </div>
                </div>
            )}
        </>
    );
};
