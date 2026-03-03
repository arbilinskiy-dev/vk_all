import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { plural } from '../../../shared/utils/plural';

interface CustomSelectProps {
    value: string[];
    options: string[];
    onChange: (value: string[]) => void;
}

/**
 * Мультиселект с порталом для выбора команд.
 * Поддерживает создание новой команды, очистку, чекбокс-индикаторы.
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    const updatePosition = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    const toggleDropdown = useCallback(() => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(prev => !prev);
    }, [isOpen, updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && wrapperRef.current && !wrapperRef.current.contains(event.target as Node) && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
                setNewTeamName('');
            }
        };

        const handleScrollOrResize = () => {
            if (isOpen) {
                updatePosition();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, updatePosition]);

    // Переключение команды (добавить/убрать из массива)
    const handleToggle = (option: string) => {
        const isSelected = value.includes(option);
        if (isSelected) {
            onChange(value.filter(t => t !== option));
        } else {
            onChange([...value, option]);
        }
    };

    // Очистить все команды
    const handleClearAll = () => {
        onChange([]);
        setIsOpen(false);
    };

    const handleAddNewTeam = () => {
        const trimmedName = newTeamName.trim();
        if (trimmedName && !options.includes(trimmedName)) {
            onChange([...value, trimmedName]);
        }
        setNewTeamName('');
        setIsCreating(false);
    };

    // Отображаемый текст в кнопке
    // Склонение числительных по дизайн-системе
    const displayText = value.length === 0 
        ? 'Без команды' 
        : value.length === 1 
            ? value[0] 
            : plural(value.length, ['команда', 'команды', 'команд']);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={toggleDropdown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white hover:bg-gray-50 flex justify-between items-center transition-colors"
            >
                <span className="truncate">{displayText}</span>
                <svg className={`h-4 w-4 flex-shrink-0 ml-1 text-gray-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && createPortal(
                <div 
                    ref={dropdownRef}
                    className="fixed z-[100] mt-1 bg-white rounded-md shadow-lg border border-gray-200 animate-fade-in-up"
                    style={{ 
                        top: `${position.top}px`, 
                        left: `${position.left}px`, 
                        width: `${Math.max(position.width, 200)}px`
                    }}
                >
                    {isCreating ? (
                        <div className="p-2 flex items-center gap-1.5">
                            <input
                                type="text"
                                placeholder="Название команды..."
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                className="flex-grow border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNewTeam();
                                    } else if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setNewTeamName('');
                                    }
                                }}
                            />
                            <button
                                onClick={handleAddNewTeam}
                                title="Сохранить"
                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button
                                onClick={() => { setIsCreating(false); setNewTeamName(''); }}
                                title="Отмена"
                                className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <span>Создать</span>
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={handleClearAll}
                                className={`block w-full text-left px-3 py-2 text-sm transition-colors ${value.length === 0 ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-900'}`}
                            >
                                Без команды
                            </button>
                            {options.map(option => {
                                const isSelected = value.includes(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleToggle(option)}
                                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-900'}`}
                                    >
                                        {/* Чекбокс-индикатор */}
                                        <span className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </span>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>, 
                document.body
            )}
        </div>
    );
};
