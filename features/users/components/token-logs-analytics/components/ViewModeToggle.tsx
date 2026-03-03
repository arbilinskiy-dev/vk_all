import React from 'react';
import { ViewMode } from '../constants';

interface ViewModeToggleProps {
    viewMode: ViewMode;
    onChange: (mode: ViewMode) => void;
}

/**
 * Переключатель режима отображения (график / таблица)
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onChange }) => {
    return (
        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-700">Режим отображения:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                    onClick={() => onChange('chart')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'chart' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    График
                </button>
                <button
                    onClick={() => onChange('table')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'table' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Таблица
                </button>
            </div>
        </div>
    );
};
