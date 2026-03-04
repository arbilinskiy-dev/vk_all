import React from 'react';

// =====================================================================
// MockDiffViewer — визуализация изменений текста
// =====================================================================
interface MockDiffViewerProps {
    oldText: string;
    newText: string;
}

export const MockDiffViewer: React.FC<MockDiffViewerProps> = ({ oldText, newText }) => {
    // Простая визуализация без сложного алгоритма
    const renderDiff = () => {
        if (oldText === newText) {
            return <span>{oldText}</span>;
        }
        return (
            <>
                <span className="bg-red-100 text-red-800 rounded line-through px-0.5">{oldText}</span>
                {' → '}
                <span className="bg-green-100 text-green-800 rounded px-0.5">{newText}</span>
            </>
        );
    };

    return (
        <div className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm whitespace-pre-wrap leading-normal custom-scrollbar max-h-40 overflow-y-auto">
            {renderDiff()}
        </div>
    );
};
