// SlidePanel — универсальная выезжающая панель справа.
// Используется вместо центрированных модальных окон для контента,
// где нужно много места (посты, настройки, формы и т.д.).
// Панель выезжает справа налево с анимацией и занимает указанную ширину экрана.
// По умолчанию — 65% ширины, на мобильных — 100%.

import React, { useEffect, useCallback, useState, useRef } from 'react';

interface SlidePanelProps {
    /** Открыта ли панель */
    isOpen: boolean;
    /** Обработчик закрытия (клик по overlay, Escape) */
    onClose: () => void;
    /** Ширина панели в CSS-единицах. По умолчанию '65vw'. На мобильных автоматически 100%. */
    width?: string;
    /** z-index панели. По умолчанию 'z-50' */
    zIndex?: string;
    /** Содержимое панели (header, main, footer — как children) */
    children: React.ReactNode;
    /** Дополнительные CSS-классы для контейнера панели */
    className?: string;
    /** Отключить закрытие по клику на overlay */
    disableOverlayClose?: boolean;
    /** Отключить закрытие по Escape */
    disableEscapeClose?: boolean;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
    isOpen,
    onClose,
    width = '85vw',
    zIndex = 'z-50',
    children,
    className = '',
    disableOverlayClose = false,
    disableEscapeClose = false,
}) => {
    // Состояние анимации закрытия
    const [isClosing, setIsClosing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Обработка Escape
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && !disableEscapeClose) {
            onClose();
        }
    }, [onClose, disableEscapeClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Блокируем скролл body при открытой панели
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, handleKeyDown]);

    // Клик по overlay
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        // Проверяем, что клик был именно по overlay, а не по панели
        if (e.target === e.currentTarget && !disableOverlayClose) {
            onClose();
        }
    }, [onClose, disableOverlayClose]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 ${zIndex} flex justify-end slide-panel-overlay ${isClosing ? 'slide-panel-closing' : ''}`}
            onClick={handleOverlayClick}
        >
            {/* Хлястик закрытия — слева от панели */}
            <button
                onClick={onClose}
                className="self-start mt-4 -mr-1 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-l-2xl shadow-lg px-4 py-3 transition-colors flex-shrink-0 slide-panel-content"
                title="Закрыть"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div
                ref={panelRef}
                className={`bg-white shadow-2xl flex flex-col h-full slide-panel-content rounded-l-2xl 
                    w-full sm:w-[85vw] md:w-[85vw] lg:max-w-none
                    ${className}`}
                style={{ maxWidth: width, minWidth: '320px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};
