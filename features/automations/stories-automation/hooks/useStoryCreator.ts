import { useState, useCallback, useRef } from 'react';
import { publishDirectStory, publishDirectStoryMulti, DirectStoryResult } from '../../../../services/api/storyPublish.api';

/** Статус публикации для одного проекта */
export interface ProjectPublishStatus {
    projectId: string;
    projectName: string;
    status: 'pending' | 'publishing' | 'success' | 'error';
    result?: DirectStoryResult;
    error?: string;
}

/** Ограничения VK Stories */
const PHOTO_MAX_SIZE_MB = 10;
const PHOTO_MAX_DIMENSION_SUM = 14000; // ширина + высота ≤ 14000 px
const VIDEO_MAX_WIDTH = 720;
const VIDEO_MAX_HEIGHT = 1280;
const VIDEO_MAX_FPS = 30;
const PHOTO_FORMATS = ['image/jpeg', 'image/png', 'image/gif'];
const VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

interface UseStoryCreatorReturn {
    // Файл
    selectedFile: File | null;
    filePreviewUrl: string | null;
    fileType: 'photo' | 'video' | null;
    validationError: string | null;
    isValidating: boolean;
    handleFileSelect: (file: File | null) => void;
    
    // Параметры ссылки
    linkText: string;
    setLinkText: (val: string) => void;
    linkUrl: string;
    setLinkUrl: (val: string) => void;
    
    // Мультипроект
    isMultiProjectMode: boolean;
    setIsMultiProjectMode: (val: boolean) => void;
    selectedProjectIds: Set<string>;
    setSelectedProjectIds: (ids: Set<string>) => void;
    
    // Публикация
    isPublishing: boolean;
    publishStatuses: ProjectPublishStatus[];
    publishResults: DirectStoryResult[];
    handlePublish: (currentProjectId: string, getProjectName: (id: string) => string) => Promise<void>;
    
    // Сброс
    resetForm: () => void;
}

export const useStoryCreator = (): UseStoryCreatorReturn => {
    // Файл
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'photo' | 'video' | null>(null);
    
    // Параметры ссылки
    const [linkText, setLinkText] = useState<string>('');
    const [linkUrl, setLinkUrl] = useState<string>('');
    
    // Мультипроект
    const [isMultiProjectMode, setIsMultiProjectMode] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    
    // Валидация
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    
    // Публикация
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishStatuses, setPublishStatuses] = useState<ProjectPublishStatus[]>([]);
    const [publishResults, setPublishResults] = useState<DirectStoryResult[]>([]);
    
    // Ref для предотвращения утечки objectUrl
    const prevPreviewRef = useRef<string | null>(null);

    /** Валидация фото: формат, размер, разрешение */
    const validatePhoto = useCallback((file: File, objectUrl: string): Promise<string | null> => {
        return new Promise((resolve) => {
            // Проверка формата
            if (!PHOTO_FORMATS.includes(file.type)) {
                resolve(`Неподдерживаемый формат фото. Допустимы: JPG, PNG, GIF (получен: ${file.type})`);
                return;
            }
            
            // Проверка размера файла
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > PHOTO_MAX_SIZE_MB) {
                resolve(`Фото слишком большое: ${sizeMB.toFixed(1)} МБ (максимум ${PHOTO_MAX_SIZE_MB} МБ)`);
                return;
            }
            
            // Проверка разрешения (асинхронно через Image)
            const img = new Image();
            img.onload = () => {
                const sum = img.naturalWidth + img.naturalHeight;
                if (sum > PHOTO_MAX_DIMENSION_SUM) {
                    resolve(`Разрешение фото слишком большое: ${img.naturalWidth}×${img.naturalHeight} (сумма ${sum} px, максимум ${PHOTO_MAX_DIMENSION_SUM} px)`);
                } else {
                    resolve(null);
                }
            };
            img.onerror = () => {
                resolve('Не удалось загрузить изображение для проверки');
            };
            img.src = objectUrl;
        });
    }, []);

    /** Валидация видео: формат, разрешение */
    const validateVideo = useCallback((file: File, objectUrl: string): Promise<string | null> => {
        return new Promise((resolve) => {
            // Проверка формата
            if (!VIDEO_FORMATS.includes(file.type)) {
                resolve(`Неподдерживаемый формат видео. Допустимы: MP4, MOV, AVI, WebM (получен: ${file.type})`);
                return;
            }
            
            // Проверка разрешения через Video элемент
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                const w = video.videoWidth;
                const h = video.videoHeight;
                
                if (w > VIDEO_MAX_WIDTH || h > VIDEO_MAX_HEIGHT) {
                    resolve(`Разрешение видео ${w}×${h} превышает допустимое ${VIDEO_MAX_WIDTH}×${VIDEO_MAX_HEIGHT}`);
                } else {
                    resolve(null);
                }
            };
            video.onerror = () => {
                resolve('Не удалось загрузить видео для проверки');
            };
            video.src = objectUrl;
        });
    }, []);

    /** Выбор файла с автоопределением типа и валидацией */
    const handleFileSelect = useCallback((file: File | null) => {
        // Очищаем предыдущий objectUrl
        if (prevPreviewRef.current) {
            URL.revokeObjectURL(prevPreviewRef.current);
            prevPreviewRef.current = null;
        }
        
        setValidationError(null);
        
        if (!file) {
            setSelectedFile(null);
            setFilePreviewUrl(null);
            setFileType(null);
            setIsValidating(false);
            return;
        }
        
        // Определяем тип
        const isVideo = file.type.startsWith('video/');
        setFileType(isVideo ? 'video' : 'photo');
        
        // Создаём превью
        const url = URL.createObjectURL(file);
        prevPreviewRef.current = url;
        setFilePreviewUrl(url);
        setSelectedFile(file);
        
        // Запускаем асинхронную валидацию
        setIsValidating(true);
        const validate = isVideo ? validateVideo(file, url) : validatePhoto(file, url);
        validate.then((error) => {
            setValidationError(error);
            setIsValidating(false);
        });
    }, [validatePhoto, validateVideo]);

    /** Публикация в выбранные проекты */
    const handlePublish = useCallback(async (
        currentProjectId: string,
        getProjectName: (id: string) => string,
    ) => {
        if (!selectedFile) return;
        
        const lText = linkText || undefined;
        const lUrl = linkUrl || undefined;
        const file = selectedFile;
        
        // Определяем список проектов
        const projectIds: string[] = isMultiProjectMode && selectedProjectIds.size > 0
            ? Array.from(selectedProjectIds)
            : [currentProjectId];
        
        // Инициализируем статусы — все на "publishing" сразу
        const initialStatuses: ProjectPublishStatus[] = projectIds.map(id => ({
            projectId: id,
            projectName: getProjectName(id),
            status: 'publishing',
        }));
        
        setPublishStatuses(initialStatuses);
        setPublishResults([]);
        setIsPublishing(true);
        
        try {
            if (projectIds.length === 1) {
                // Одиночная публикация — используем прямой эндпоинт
                try {
                    const result = await publishDirectStory(file, projectIds[0], lText, lUrl);
                    
                    setPublishStatuses([{
                        ...initialStatuses[0],
                        status: result.story_link ? 'success' : 'error',
                        result: result.story_link ? result : undefined,
                        error: result.story_link ? undefined : 'VK вернул пустой ответ',
                    }]);
                    
                    if (result.story_link) setPublishResults([result]);
                } catch (err) {
                    setPublishStatuses([{
                        ...initialStatuses[0],
                        status: 'error',
                        error: err instanceof Error ? err.message : 'Неизвестная ошибка',
                    }]);
                }
            } else {
                // Мультипроектная публикация — файл один раз, бэкенд раздаёт параллельно
                const multiResult = await publishDirectStoryMulti(file, projectIds, lText, lUrl);
                
                // Маппим результаты на статусы
                const newStatuses: ProjectPublishStatus[] = multiResult.results.map(r => {
                    const name = getProjectName(r.project_id);
                    return {
                        projectId: r.project_id,
                        projectName: name,
                        status: r.status === 'success' ? 'success' as const : 'error' as const,
                        result: r.status === 'success' ? r : undefined,
                        error: r.status === 'error' ? (r.error || 'Ошибка публикации') : undefined,
                    };
                });
                
                setPublishStatuses(newStatuses);
                setPublishResults(multiResult.results.filter(r => r.status === 'success'));
            }
        } catch (err) {
            // Критическая ошибка запроса (сеть, 500 и т.д.)
            const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setPublishStatuses(prev => prev.map(s => ({
                ...s,
                status: 'error' as const,
                error: errorMsg,
            })));
        }
        
        setIsPublishing(false);
    }, [selectedFile, isMultiProjectMode, selectedProjectIds, linkText, linkUrl]);

    /** Полный сброс формы */
    const resetForm = useCallback(() => {
        handleFileSelect(null);
        setLinkText('');
        setLinkUrl('');
        setPublishStatuses([]);
        setPublishResults([]);
    }, [handleFileSelect]);

    return {
        selectedFile,
        filePreviewUrl,
        fileType,
        validationError,
        isValidating,
        handleFileSelect,
        linkText,
        setLinkText,
        linkUrl,
        setLinkUrl,
        isMultiProjectMode,
        setIsMultiProjectMode,
        selectedProjectIds,
        setSelectedProjectIds,
        isPublishing,
        publishStatuses,
        publishResults,
        handlePublish,
        resetForm,
    };
};
