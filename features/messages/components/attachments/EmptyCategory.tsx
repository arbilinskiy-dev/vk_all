/**
 * Заглушка для пустой категории вложений.
 */
import React from 'react';

export const EmptyCategory: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-xs text-gray-400">{text}</p>
    </div>
);
