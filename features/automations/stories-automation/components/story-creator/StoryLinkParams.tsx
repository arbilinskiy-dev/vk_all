import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LINK_TEXT_OPTIONS } from './constants';

interface StoryLinkParamsProps {
    /** Текущее значение link_text */
    linkText: string;
    /** Установить link_text */
    setLinkText: (val: string) => void;
    /** Текущее значение URL */
    linkUrl: string;
    /** Установить URL */
    setLinkUrl: (val: string) => void;
}

export const StoryLinkParams: React.FC<StoryLinkParamsProps> = ({
    linkText,
    setLinkText,
    linkUrl,
    setLinkUrl,
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Ссылка в истории
                    <span className="text-xs text-gray-400 font-normal">(необязательно)</span>
                </h3>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Текст кнопки</label>
                        <LinkTextDropdown
                            value={linkText}
                            onChange={setLinkText}
                            options={LINK_TEXT_OPTIONS}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">URL ссылки</label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://vk.com/... или https://vk.ru/..."
                            disabled={!linkText}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                    </div>
                </div>
                {linkText && !linkUrl && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        Укажите URL для кнопки
                    </p>
                )}
            </div>
        </div>
    );
};


// ============================================================
// Кастомный дропдаун для выбора текста кнопки-ссылки
// ============================================================

const LinkTextDropdown: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(o => o.value === value)?.label || 'Без ссылки';

    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    const toggleOpen = useCallback(() => {
        if (!isOpen) updatePosition();
        setIsOpen(prev => !prev);
    }, [isOpen, updatePosition]);

    // Закрытие при клике вне
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        const handleScrollOrResize = () => updatePosition();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, updatePosition]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleOpen}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md transition-colors bg-white text-left
                    ${isOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <span className={value ? 'text-gray-800' : 'text-gray-500'}>{selectedLabel}</span>
                <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[100] bg-white rounded-md shadow-xl border border-gray-200 py-1 max-h-72 overflow-y-auto custom-scrollbar"
                    style={{ top: position.top, left: position.left, width: position.width }}
                >
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                value === opt.value
                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};
