import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SelectOption } from '../types';

interface MultiSelectDropdownProps {
    options: SelectOption[];
    selectedIds: Set<string>;
    onChange: (selectedIds: Set<string>) => void;
    label: string;
}

/**
 * Мультиселект-дропдаун с порталом, поиском и анимацией.
 * Соответствует дизайн-системе: fixed z-[100], портал, animate-fade-in-up,
 * поиск для динамических списков, стрелка rotate-180.
 */
export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
    options, 
    selectedIds, 
    onChange, 
    label 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 200 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Обновление позиции dropdown
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 260),
            });
        }
    }, []);

    // Открытие/закрытие
    const toggleDropdown = useCallback(() => {
        if (!isOpen) {
            updatePosition();
            setSearchQuery(''); // Сброс поиска при каждом открытии
        }
        setIsOpen(prev => !prev);
    }, [isOpen, updatePosition]);

    // Закрытие по клику вне
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Обновление позиции при scroll/resize
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = () => updatePosition();
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, updatePosition]);

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        onChange(newSet);
    };

    // Фильтрация по поисковому запросу
    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const lower = searchQuery.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(lower));
    }, [options, searchQuery]);

    // Показывать поиск для динамических списков (>7 или потенциально неограниченных)
    const showSearch = options.length > 7;
    
    const selectedCount = selectedIds.size;
    const displayLabel = selectedCount === 0 ? 'Все' : `Выбрано - ${selectedCount}`;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={`flex items-center justify-between w-44 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    selectedCount > 0 ? 'border-indigo-300 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-700'
                }`}
            >
                <span className="truncate mr-2">{label}: {displayLabel}</span>
                <svg 
                    className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[100] bg-white rounded-md shadow-lg border border-gray-200 animate-fade-in-up flex flex-col"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: position.width,
                        maxHeight: 300,
                    }}
                >
                    {/* Поле поиска */}
                    {showSearch && (
                        <div className="p-2 border-b border-gray-100 flex-shrink-0">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Список опций */}
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {filteredOptions.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-4">
                                Ничего не найдено
                            </div>
                        ) : (
                            filteredOptions.map(opt => (
                                <label 
                                    key={opt.id} 
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(opt.id)}
                                        onChange={() => handleToggle(opt.id)}
                                        className={`w-4 h-4 rounded border mr-2 ${
                                            selectedIds.has(opt.id)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-gray-300 text-indigo-600'
                                        } focus:ring-indigo-500`}
                                    />
                                    <span className="truncate">{opt.label}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
