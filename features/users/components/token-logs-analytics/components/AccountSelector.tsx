import React, { useState, useEffect, useRef } from 'react';
import { SystemAccount } from '../../../../../shared/types';
import { ACCOUNT_COLORS } from '../constants';

interface AccountSelectorProps {
    accounts: SystemAccount[];
    selectedIds: Set<string>;
    onChange: (selectedIds: Set<string>) => void;
}

/**
 * Компонент мультиселекта для выбора аккаунтов
 */
export const AccountSelector: React.FC<AccountSelectorProps> = ({ 
    accounts, 
    selectedIds, 
    onChange 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        onChange(newSet);
    };

    const options = [
        { id: 'env', label: 'ENV TOKEN (Системный)' },
        ...accounts.map(a => ({ id: a.id, label: a.full_name }))
    ];

    const handleSelectAll = () => {
        onChange(new Set(options.map(o => o.id)));
    };

    const handleClearAll = () => {
        onChange(new Set());
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-72 px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    selectedIds.size > 0 ? 'border-indigo-300 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-700'
                }`}
            >
                <span className="truncate mr-2">
                    {selectedIds.size === 0 
                        ? 'Выберите аккаунты для сравнения' 
                        : `Выбрано: ${selectedIds.size}`}
                </span>
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute z-30 w-80 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto custom-scrollbar">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Выберите аккаунты</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Все
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Снять
                            </button>
                        </div>
                    </div>
                    {options.map((opt, idx) => {
                        const isSelected = selectedIds.has(opt.id);
                        const colorIdx = Array.from(selectedIds).indexOf(opt.id);
                        const color = isSelected && colorIdx >= 0 ? ACCOUNT_COLORS[colorIdx % ACCOUNT_COLORS.length] : undefined;
                        
                        return (
                            <label 
                                key={opt.id} 
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggle(opt.id)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                                />
                                {color && (
                                    <span 
                                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                                <span className="truncate">{opt.label}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
