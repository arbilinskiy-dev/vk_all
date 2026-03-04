import React from 'react';

// =====================================================================
// Вспомогательные компоненты для mock-модальных окон поста
// =====================================================================

// Кнопка закрытия модалки
export const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="Закрыть"
    >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

// Mock-заголовок модалки
export const MockModalHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <CloseButton onClick={onClose} />
    </div>
);

// Mock-футер модалки
export const MockModalFooter: React.FC<{ 
    leftButtons?: React.ReactNode; 
    rightButtons?: React.ReactNode;
}> = ({ leftButtons, rightButtons }) => (
    <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
            {leftButtons}
        </div>
        <div className="flex gap-2">
            {rightButtons}
        </div>
    </div>
);

// Mock-секция контента
export const MockContentSection: React.FC<{ 
    title: string; 
    children: React.ReactNode;
}> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        {children}
    </div>
);

// Mock-переключатель (Toggle)
export const MockToggle: React.FC<{ 
    label: string; 
    checked: boolean; 
    onChange: () => void;
    disabled?: boolean;
}> = ({ label, checked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between py-2">
        <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
        <button
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
                checked ? 'bg-indigo-600' : 'bg-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);

// Mock-textarea
export const MockTextarea: React.FC<{ 
    value: string; 
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ value, onChange, placeholder, disabled = false }) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={8}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
            disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
        }`}
    />
);

// Mock-сетка изображений
export const MockImageGrid: React.FC<{ 
    count: number; 
    disabled?: boolean;
}> = ({ count, disabled = false }) => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
        {Array.from({ length: count }).map((_, idx) => (
            <div
                key={idx}
                className={`relative aspect-square rounded-md overflow-hidden border-2 border-gray-200 ${
                    disabled ? 'opacity-50' : 'hover:border-indigo-400 cursor-pointer group'
                }`}
            >
                <img
                    src={`https://picsum.photos/seed/post-modal-${idx}/200/200`}
                    alt={`Изображение ${idx + 1}`}
                    className="w-full h-full object-cover"
                />
                {!disabled && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        ))}
    </div>
);
