
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Режим отображения: дни → месяцы → годы (drill-down при клике на заголовок)
type ViewMode = 'days' | 'months' | 'years';

const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Сдвиг для Пн=0, Вс=6
};

/** Начало десятилетия для сетки годов (напр. 2020 для 2026) */
const getDecadeStart = (year: number) => Math.floor(year / 10) * 10;

// --- SVG стрелки (повторно используемые) ---
const ArrowLeft = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
);
const ArrowRight = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);

interface CustomDatePickerProps {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
    value, 
    onChange, 
    disabled, 
    className, 
    placeholder = "Выберите дату" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
    const [viewDate, setViewDate] = useState(value ? parseDate(value) : new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('days');
    
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            setViewDate(parseDate(value));
        }
    }, [value, isOpen]);

    // При открытии календаря — всегда начинаем с режима дней
    useEffect(() => {
        if (isOpen) setViewMode('days');
    }, [isOpen]);

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const calendarHeight = 360; 

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            if (spaceBelow < calendarHeight && spaceAbove > calendarHeight) {
                setPosition({ top: rect.top - 4, left: rect.left });
                setOpenDirection('up');
            } else {
                setPosition({ top: rect.bottom + 4, left: rect.left });
                setOpenDirection('down');
            }
        }
    };

    const toggle = () => {
        if (disabled) return;
        if (!isOpen) {
             updatePosition();
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && 
                buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => { if(isOpen) updatePosition(); };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    // --- Навигация: дни ---
    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    
    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(formatDate(newDate));
        setIsOpen(false);
    };

    const handleTodayClick = () => {
        const today = new Date();
        onChange(formatDate(today));
        setIsOpen(false);
    };

    // --- Навигация: месяцы ---
    const handlePrevYear = () => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    const handleNextYear = () => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    const handleMonthSelect = (monthIdx: number) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIdx, 1));
        setViewMode('days');
    };

    // --- Навигация: годы (сетка 12 лет = десятилетие ± 1) ---
    const decadeStart = getDecadeStart(viewDate.getFullYear());
    const handlePrevDecade = () => setViewDate(new Date(viewDate.getFullYear() - 10, viewDate.getMonth(), 1));
    const handleNextDecade = () => setViewDate(new Date(viewDate.getFullYear() + 10, viewDate.getMonth(), 1));
    const handleYearSelect = (year: number) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setViewMode('months');
    };

    // --- Клик на заголовок: дни → месяцы → годы ---
    const handleHeaderClick = () => {
        if (viewMode === 'days') setViewMode('months');
        else if (viewMode === 'months') setViewMode('years');
    };

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDayIdx = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptySlots = Array.from({ length: firstDayIdx }, (_, i) => i);
    
    const selectedDate = value ? parseDate(value) : null;
    const isSelected = (day: number) => 
        selectedDate &&
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === viewDate.getMonth() && 
        selectedDate.getFullYear() === viewDate.getFullYear();
    
    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
    };

    // Заголовок зависит от режима
    const headerLabel = viewMode === 'days'
        ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
        : viewMode === 'months'
        ? `${viewDate.getFullYear()}`
        : `${decadeStart} – ${decadeStart + 9}`;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggle}
                disabled={disabled}
                className={`flex justify-between items-center border rounded-md px-2 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow h-[34px] bg-white ${className} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            >
                <span className={!value ? 'text-gray-400' : 'text-gray-800'}>
                    {value ? new Date(value).toLocaleDateString('ru-RU') : placeholder}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className={`fixed z-[100] ${openDirection === 'up' ? '-translate-y-full' : ''}`}
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 animate-fade-in-up select-none">
                        {/* ── Шапка: кликабельный заголовок + стрелки ── */}
                        <div className="flex justify-between items-center mb-2">
                            <button
                                type="button"
                                onClick={handleHeaderClick}
                                className={`font-bold text-gray-700 hover:text-blue-600 transition-colors ${viewMode === 'years' ? 'cursor-default hover:text-gray-700' : 'cursor-pointer'}`}
                            >
                                {headerLabel}
                            </button>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={viewMode === 'days' ? handlePrevMonth : viewMode === 'months' ? handlePrevYear : handlePrevDecade}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ArrowLeft />
                                </button>
                                <button
                                    type="button"
                                    onClick={viewMode === 'days' ? handleNextMonth : viewMode === 'months' ? handleNextYear : handleNextDecade}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ArrowRight />
                                </button>
                            </div>
                        </div>

                        {/* ── Режим: дни ── */}
                        {viewMode === 'days' && (
                            <>
                                <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                                    {WEEKDAYS.map(d => <div key={d} className="text-xs text-gray-400 font-medium">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {emptySlots.map(i => <div key={`empty-${i}`} />)}
                                    {daysArray.map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleDayClick(day)}
                                            className={`w-7 h-7 text-sm rounded-full flex items-center justify-center transition-colors ${
                                                isSelected(day) ? 'bg-blue-500 text-white' : 
                                                isToday(day) ? 'text-blue-600 font-bold hover:bg-blue-50' : 
                                                'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-3 pt-2 border-t border-gray-100 text-xs">
                                    <button type="button" onClick={() => {/*Logic for clear if needed*/}} className="text-red-500 hover:text-red-700 hidden">Удалить</button>
                                    <button type="button" onClick={handleTodayClick} className="text-blue-600 hover:text-blue-800 font-medium w-full text-right">Сегодня</button>
                                </div>
                            </>
                        )}

                        {/* ── Режим: выбор месяца ── */}
                        {viewMode === 'months' && (
                            <div className="grid grid-cols-3 gap-2 py-1">
                                {MONTHS_SHORT.map((m, idx) => {
                                    const isCurrent = selectedDate && selectedDate.getMonth() === idx && selectedDate.getFullYear() === viewDate.getFullYear();
                                    const isThisMonth = new Date().getMonth() === idx && new Date().getFullYear() === viewDate.getFullYear();
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleMonthSelect(idx)}
                                            className={`py-2 text-sm rounded-lg transition-colors ${
                                                isCurrent ? 'bg-blue-500 text-white' :
                                                isThisMonth ? 'text-blue-600 font-bold hover:bg-blue-50' :
                                                'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Режим: выбор года (сетка 4×3 = 12 лет) ── */}
                        {viewMode === 'years' && (
                            <div className="grid grid-cols-3 gap-2 py-1">
                                {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map(year => {
                                    const isCurrentYear = selectedDate && selectedDate.getFullYear() === year;
                                    const isThisYear = new Date().getFullYear() === year;
                                    const isOutOfDecade = year < decadeStart || year > decadeStart + 9;
                                    return (
                                        <button
                                            key={year}
                                            type="button"
                                            onClick={() => handleYearSelect(year)}
                                            className={`py-2 text-sm rounded-lg transition-colors ${
                                                isCurrentYear ? 'bg-blue-500 text-white' :
                                                isThisYear ? 'text-blue-600 font-bold hover:bg-blue-50' :
                                                isOutOfDecade ? 'text-gray-400 hover:bg-gray-50' :
                                                'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {year}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
