import React, { useState } from 'react';

// =====================================================================
// Демо: Форма загрузки промокодов
// =====================================================================
export const UploadFormDemo: React.FC = () => {
    const [inputValue, setInputValue] = useState('PROMO123 | Скидка 500₽\nSALE30OFF | Скидка 30%\nFREESHIP | Бесплатная доставка');

    return (
        <div className="w-full bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col h-96">
            <h3 className="font-semibold text-gray-800 mb-2">Загрузка кодов</h3>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Формат загрузки:</p>
                <p className="font-mono bg-white/50 p-1 rounded mb-1">КОД | ОПИСАНИЕ ПРИЗА</p>
                <p>Каждая пара с новой строки. Описание будет использовано в переменной <code>{'{description}'}</code>.</p>
                <p className="mt-2 text-blue-600 italic">💡 Совет: Вы можете скопировать два столбца прямо из Excel и вставить сюда — формат исправится автоматически.</p>
            </div>
            <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full flex-grow border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3 custom-scrollbar font-mono resize-none"
                placeholder="PROMO123 | Скидка 500р&#10;PROMO456 | Сет роллов&#10;WIN_777 | Пицца в подарок"
            />
            <button 
                className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
                Загрузить в базу
            </button>
        </div>
    );
};
