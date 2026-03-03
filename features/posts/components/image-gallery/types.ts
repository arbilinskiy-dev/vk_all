
import { Photo } from '../../../../shared/types';

export type UploadStatus = 'uploading' | 'completed' | 'failed';

export interface UploadingPhoto {
    tempId: string;
    file: File;
    status: UploadStatus;
    error?: string;
}

export interface ImageGalleryProps {
    projectId: string;
    onAddImages: (photos: Photo[]) => void;
}
