import React from 'react';

/** Ячейка одного показателя статистики (просмотры, лайки и т.д.) */
export const StatItem = ({ label, data, color = 'indigo', fullLabel }: { label: string, data: { state?: string, count: number } | undefined, color?: string, fullLabel?: string }) => {
    if (!data) return (
        <div className="flex flex-col items-center bg-gray-50 p-1.5 rounded border border-gray-100 min-w-[50px] h-full justify-center">
            <span className="text-[10px] text-gray-400 uppercase font-medium truncate w-full text-center" title={fullLabel || label}>{label}</span>
            <span className="text-sm font-semibold text-gray-300">-</span>
        </div>
    );
    
    // State can be 'on' 'off' 'hidden'. If state is missing but count exists, assume valid.
    const isOff = data.state && data.state !== 'on';
    
    return (
        <div className={`flex flex-col items-center p-1.5 rounded border min-w-[50px] h-full justify-center transition-colors ${isOff ? 'bg-gray-50 border-gray-200 opacity-60' : `bg-${color}-50 border-${color}-100 hover:bg-${color}-100`}`}>
            <span className={`text-[10px] uppercase font-bold truncate w-full text-center ${isOff ? 'text-gray-400' : `text-${color}-600`}`} title={fullLabel || label}>{label}</span>
            <span className={`text-sm font-bold ${isOff ? 'text-gray-400' : `text-${color}-800`}`}>{data.count}</span>
        </div>
    );
};
