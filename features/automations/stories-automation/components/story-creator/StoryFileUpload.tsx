import React, { useRef } from 'react';
import { ACCEPTED_ALL } from './constants';

interface StoryFileUploadProps {
    /** Выбранный файл */
    selectedFile: File | null;
    /** URL для превью */
    filePreviewUrl: string | null;
    /** Тип файла: фото или видео */
    fileType: 'photo' | 'video' | null;
    /** Ошибка валидации */
    validationError: string | null;
    /** Идёт ли валидация */
    isValidating: boolean;
    /** Обработчик выбора файла */
    onFileSelect: (file: File | null) => void;
}

export const StoryFileUpload: React.FC<StoryFileUploadProps> = ({
    selectedFile,
    filePreviewUrl,
    fileType,
    validationError,
    isValidating,
    onFileSelect,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) onFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Медиафайл истории
                </h3>
            </div>

            <div className="p-5">
                {!selectedFile ? (
                    /* Зона загрузки */
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer 
                                   hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors group"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Нажмите или перетащите файл</p>
                                <p className="text-xs text-gray-500 mt-1">Фото: JPG, PNG, GIF (до 10 МБ) • Видео: MP4, MOV (720×1280, 30fps)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Превью загруженного файла */
                    <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden bg-black/5 flex items-center justify-center"
                             style={{ maxHeight: '400px' }}>
                            {fileType === 'photo' ? (
                                <img
                                    src={filePreviewUrl || ''}
                                    alt="Превью"
                                    className="max-h-[400px] object-contain rounded-xl"
                                />
                            ) : (
                                <video
                                    src={filePreviewUrl || ''}
                                    controls
                                    className="max-h-[400px] rounded-xl"
                                    style={{ maxWidth: '100%' }}
                                />
                            )}

                            {/* Бейдж типа */}
                            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1
                                ${fileType === 'video' ? 'bg-red-500' : 'bg-indigo-500'}`}>
                                {fileType === 'video' ? (
                                    <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Видео</>
                                ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Фото</>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">{selectedFile.name}</span>
                                <span className="text-gray-400 ml-2">
                                    ({(selectedFile.size / (1024 * 1024)).toFixed(1)} МБ)
                                </span>
                            </div>
                            <button
                                onClick={() => { onFileSelect(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Удалить
                            </button>
                        </div>

                        {/* Индикатор валидации */}
                        {isValidating && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-md">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                <span className="text-xs text-indigo-700">Проверка файла...</span>
                            </div>
                        )}

                        {/* Ошибка валидации */}
                        {validationError && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
                                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-red-700">{validationError}</p>
                                    <p className="text-xs text-red-500 mt-1">
                                        {fileType === 'photo'
                                            ? 'Требования VK: JPG, PNG, GIF • сумма сторон ≤ 14 000 px • до 10 МБ'
                                            : 'Требования VK: MP4 (H.264/AAC) • макс. 720×1280 • 30 fps'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_ALL}
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>
        </div>
    );
};
