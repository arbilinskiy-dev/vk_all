
import { PhotoAttachment, Attachment } from '../../../../../shared/types';

export type UploadStatus = 'uploading' | 'completed' | 'failed';

export interface UploadingFile {
  // Временный ID для отслеживания процесса загрузки
  tempId: string; 
  status: UploadStatus;
  file: File; 
  error?: string;
}

export interface PostMediaSectionProps {
    mode: 'view' | 'edit' | 'copy';
    editedImages: PhotoAttachment[];
    onImagesChange: React.Dispatch<React.SetStateAction<PhotoAttachment[]>>;
    onUploadStateChange: (isUploading: boolean) => void;
    postAttachments: Attachment[];
    editedAttachments: Attachment[];
    onAttachmentsChange: React.Dispatch<React.SetStateAction<Attachment[]>>;
    projectId: string;
    collapsible?: boolean; // Новый проп для компактного режима
    /** Показывать секцию «Вложения» (AttachmentsDisplay) внутри компонента. По умолчанию true. */
    showAttachments?: boolean;
    // Мультипроектная перезагрузка: сохранение/удаление оригинальных File-объектов видео
    onVideoFileStored?: (attachmentId: string, file: File) => void;
    onVideoFileRemoved?: (attachmentId: string) => void;
}
