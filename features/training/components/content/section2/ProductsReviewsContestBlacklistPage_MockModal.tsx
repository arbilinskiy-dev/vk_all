/**
 * Mock-компонент модального окна добавления в чёрный список.
 * Извлечён из ProductsReviewsContestBlacklistPage для декомпозиции.
 */
import React, { useState } from 'react';

// =====================================================================
// MOCK-КОМПОНЕНТ: Всплывающее окно добавления в ЧС
// =====================================================================

export const MockAddBlacklistModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [urls, setUrls] = useState('');
    const [isForever, setIsForever] = useState(true);
    const [untilDate, setUntilDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in-up">
            <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
                {/* Шапка */}
                <header className="p-4 border-b flex justify-between items-center bg-white">
                    <h2 className="text-lg font-semibold text-gray-800">Добавить в ЧС</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                {/* Контент */}
                <main className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Поле ввода URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Ссылки на профили VK
                        </label>
                        <textarea
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md custom-scrollbar resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Введите ссылки на профили (по одной на строку)&#10;Например:&#10;https://vk.com/id12345&#10;https://vk.com/durov"
                        />
                        <p className="text-xs text-gray-500 mt-1">Можно добавить несколько пользователей сразу.</p>
                    </div>

                    {/* Срок блокировки */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Срок блокировки</label>
                        <div className="space-y-3">
                            {/* Бессрочно */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="duration" 
                                    checked={isForever}
                                    onChange={() => setIsForever(true)}
                                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">Бессрочно (Навсегда)</p>
                                    <p className="text-xs text-gray-500">Пользователь останется в черном списке постоянно</p>
                                </div>
                            </label>

                            {/* До определенной даты */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="duration" 
                                    checked={!isForever}
                                    onChange={() => setIsForever(false)}
                                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">До определенной даты</p>
                                    <p className="text-xs text-gray-500">Пользователь будет автоматически разблокирован</p>
                                </div>
                            </label>

                            {/* Выбор даты */}
                            {!isForever && (
                                <div className="ml-6 animate-fade-in-up">
                                    <input 
                                        type="date"
                                        value={untilDate}
                                        onChange={(e) => setUntilDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Пользователь будет автоматически разблокирован после этой даты.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Футер */}
                <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors">
                        Отмена
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !urls.trim()}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 flex items-center min-w-[100px] justify-center transition-colors"
                    >
                        {isSaving ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Сохранить'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
