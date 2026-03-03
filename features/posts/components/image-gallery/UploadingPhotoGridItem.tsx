
import React, { useState, useEffect } from 'react';
import { UploadingPhoto } from './types';

export const UploadingPhotoGridItem: React.FC<{ item: UploadingPhoto }> = ({ item }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(item.file);
    }, [item.file]);

    return (
        <div className="relative aspect-square group animate-fade-in-up">
            {previewUrl && <img src={previewUrl} className="w-full h-full object-cover rounded opacity-50" alt="uploading preview"/>}
            <div className={`absolute inset-0 rounded flex items-center justify-center text-white ${item.status === 'failed' ? 'bg-red-800/80' : 'bg-black/50'}`}>
                {item.status === 'failed' ? (
                    <div className="text-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs break-all" title={item.error}>{item.error && item.error.length > 20 ? 'Ошибка' : item.error}</p>
                    </div>
                ) : (
                    <div className="loader border-white border-t-transparent"></div>
                )}
            </div>
        </div>
    );
};
