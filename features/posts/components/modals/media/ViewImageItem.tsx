
import React, { useState } from 'react';

// Компонент изображения в режиме просмотра (skeleton + fade-in)
export const ViewImageItem: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            {/* Скелетон-плейсхолдер */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse" />
            )}
            {/* Фото с плавным появлением */}
            <img
                src={url}
                alt={alt}
                className={`w-full h-full object-cover rounded-lg border-2 border-white transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
            />
        </>
    );
};
