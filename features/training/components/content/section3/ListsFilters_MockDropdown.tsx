import React, { useState } from 'react';

// =====================================================================
// Интерфейс опции фильтра
// =====================================================================
export interface FilterOption {
    value: string;
    label: string;
}

// =====================================================================
// Mock-компонент: FilterDropdown — выпадающий список фильтра
// =====================================================================
export const MockFilterDropdown: React.FC<{
    label: string;
    options: FilterOption[];
    activeValue: string;
    onSelect: (value: string) => void;
}> = ({ label, options, activeValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                    activeValue !== options[0].value
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
                {label}
                <svg className="inline-block ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onSelect(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    activeValue === opt.value
                                        ? 'bg-indigo-100 text-indigo-800 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
