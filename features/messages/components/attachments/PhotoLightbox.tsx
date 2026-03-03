/**
 * Лайтбокс для просмотра фотографий с навигацией влево/вправо.
 * Открывается через Portal на body.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageAttachment } from '../../types';

interface PhotoLightboxProps {
    photos: MessageAttachment[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photos, currentIndex, onClose, onNavigate }) => {
    
    // Навигация по клавишам (Escape, стрелки)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
            if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
        };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [currentIndex, photos.length, onClose, onNavigate]);

    const current = photos[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < photos.length - 1;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            {/* Кнопка закрытия */}
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[10000]"
                title="Закрыть"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Счётчик фотографий */}
            {photos.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full z-[10000]">
                    {currentIndex + 1} / {photos.length}
                </div>
            )}

            {/* Кнопка «назад» */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[10000]"
                    title="Предыдущее"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Кнопка «вперёд» */}
            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[10000]"
                    title="Следующее"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Основное изображение */}
            <img
                src={current.url}
                alt="Фото"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                onClick={e => e.stopPropagation()}
            />
        </div>,
        document.body
    );
};
