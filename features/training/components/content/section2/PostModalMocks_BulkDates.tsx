import React, { useState } from 'react';

// =====================================================================
// Mock-компоненты для страницы "Массовое создание"
// =====================================================================

// Демонстрация переключателя массового создания с блокировкой
export const BulkModeToggleDemo: React.FC = () => {
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [isCyclic, setIsCyclic] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="space-y-6">
            {/* Управляющие кнопки */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <button
                    onClick={() => setIsCyclic(!isCyclic)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    {isCyclic ? '✓' : ''} Включить цикличность (имитация)
                </button>
                <button
                    onClick={() => {
                        setIsSaving(true);
                        setTimeout(() => setIsSaving(false), 1500);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Имитировать сохранение
                </button>
            </div>

            {/* Переключатель массового создания */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <button
                    type="button"
                    onClick={() => !isSaving && !isCyclic && setIsBulkMode(!isBulkMode)}
                    disabled={isSaving || isCyclic}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors disabled:opacity-50 flex-shrink-0 ${
                        isBulkMode ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        isBulkMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
                <label 
                    onClick={() => !isSaving && !isCyclic && setIsBulkMode(!isBulkMode)}
                    className={`text-sm font-medium text-gray-700 cursor-pointer select-none ${
                        isCyclic ? 'opacity-50' : ''
                    }`}
                >
                    Создать несколько постов
                </label>
            </div>

            {/* Статус */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">Текущее состояние:</p>
                <ul className="list-disc list-inside mt-2 text-sm text-blue-800 space-y-1">
                    <li>Массовое создание: {isBulkMode ? '✅ Включено' : '❌ Выключено'}</li>
                    <li>Циклическая публикация: {isCyclic ? '✅ Включена (блокирует bulk)' : '❌ Выключена'}</li>
                    <li>Сохранение: {isSaving ? '⏳ В процессе...' : '✅ Готов'}</li>
                    <li>Переключатель: {isCyclic || isSaving ? '🔒 Заблокирован' : '🔓 Активен'}</li>
                </ul>
            </div>
        </div>
    );
};

// Демонстрация списка слотов с добавлением/удалением
export const DateSlotsListDemo: React.FC = () => {
    const [slots, setSlots] = useState([
        { id: 1, date: '2024-03-15', time: '10:00' },
        { id: 2, date: '2024-03-16', time: '10:00' }
    ]);

    const addSlot = () => {
        if (slots.length >= 10) return;
        const lastSlot = slots[slots.length - 1];
        const nextDate = new Date(lastSlot.date);
        nextDate.setDate(nextDate.getDate() + 1);
        const dateString = nextDate.toISOString().split('T')[0];
        setSlots([...slots, { 
            id: slots.length + 1, 
            date: dateString, 
            time: lastSlot.time 
        }]);
    };

    const removeSlot = (id: number) => {
        if (slots.length <= 1) return;
        setSlots(slots.filter(s => s.id !== id));
    };

    const updateSlot = (id: number, field: 'date' | 'time', value: string) => {
        setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return (
        <div className="space-y-4">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Даты публикации ({slots.length}/10)
                </label>
                <button
                    onClick={addSlot}
                    disabled={slots.length >= 10}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Добавить дату
                </button>
            </div>

            {/* Список слотов */}
            <div className="space-y-2">
                {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2 animate-fade-in-up">
                        <input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateSlot(slot.id, 'date', e.target.value)}
                            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <input
                            type="time"
                            value={slot.time}
                            onChange={(e) => updateSlot(slot.id, 'time', e.target.value)}
                            className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => removeSlot(slot.id)}
                            disabled={slots.length <= 1}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={slots.length <= 1 ? 'Нельзя удалить последний слот' : 'Удалить'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Подсказка */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                    💡 <strong>Новый слот:</strong> Дата = последний слот + 1 день, время копируется с последнего слота
                </p>
            </div>
        </div>
    );
};

// Интерактивный калькулятор подсчёта постов
export const PostCountCalculatorDemo: React.FC = () => {
    const [projectCount, setProjectCount] = useState(3);
    const [dateCount, setDateCount] = useState(2);
    const [isMultiProject, setIsMultiProject] = useState(true);
    const [isBulkMode, setIsBulkMode] = useState(true);

    const totalPosts = (isMultiProject ? projectCount : 1) * (isBulkMode ? dateCount : 1);

    return (
        <div className="space-y-6">
            {/* Переключатели режимов */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMultiProject(!isMultiProject)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${
                                isMultiProject ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isMultiProject ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">Мультипроект</span>
                    </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsBulkMode(!isBulkMode)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${
                                isBulkMode ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isBulkMode ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">Массовое создание</span>
                    </div>
                </div>
            </div>

            {/* Ползунки */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество проектов: <span className="text-indigo-600 font-bold">{projectCount}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={projectCount}
                        onChange={(e) => setProjectCount(Number(e.target.value))}
                        disabled={!isMultiProject}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество дат: <span className="text-indigo-600 font-bold">{dateCount}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={dateCount}
                        onChange={(e) => setDateCount(Number(e.target.value))}
                        disabled={!isBulkMode}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Формула и результат */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Формула расчёта:</p>
                <div className="font-mono text-sm text-gray-800 mb-4">
                    postCount = ({isMultiProject ? projectCount : <span className="text-gray-400">1</span>}) × ({isBulkMode ? dateCount : <span className="text-gray-400">1</span>})
                </div>
                <div className="text-center">
                    <p className="text-4xl font-bold text-green-700">{totalPosts}</p>
                    <p className="text-sm text-green-600 mt-1">
                        {totalPosts === 1 ? 'пост' : totalPosts < 5 ? 'поста' : 'постов'} будет создано
                    </p>
                </div>
            </div>

            {/* Пример кнопки сохранения */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Так будет выглядеть кнопка сохранения:</p>
                <button className="w-full px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700">
                    {totalPosts > 1 ? `Запланировать (${totalPosts})` : 'Запланировать'}
                </button>
            </div>
        </div>
    );
};

// Демонстрация взаимоисключения режимов
export const BulkModeInteractionDemo: React.FC = () => {
    const [publicationMethod, setPublicationMethod] = useState<'system' | 'vk' | 'now'>('system');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [isCyclic, setIsCyclic] = useState(false);

    // Эмуляция логики из реального кода
    const handleMethodChange = (method: 'system' | 'vk' | 'now') => {
        setPublicationMethod(method);
        if (method === 'now') {
            setIsBulkMode(false);
            setIsCyclic(false);
        }
        if (method === 'vk') {
            setIsCyclic(false);
        }
    };

    const handleBulkToggle = () => {
        if (publicationMethod === 'now') return;
        if (isCyclic) return;
        setIsBulkMode(!isBulkMode);
    };

    const handleCyclicToggle = () => {
        if (publicationMethod === 'now') return;
        if (!isCyclic && isBulkMode) {
            setIsBulkMode(false);
        }
        setIsCyclic(!isCyclic);
    };

    const bulkVisible = publicationMethod !== 'now';
    const bulkEnabled = !isCyclic && publicationMethod !== 'now';
    const cyclicEnabled = publicationMethod !== 'now';

    return (
        <div className="space-y-6">
            {/* Выбор способа публикации */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Способ публикации:</label>
                <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
                    {(['system', 'vk', 'now'] as const).map((method) => (
                        <button
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                publicationMethod === method
                                    ? 'bg-white text-gray-900 shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {method === 'system' && 'Через систему'}
                            {method === 'vk' && 'В отложку VK'}
                            {method === 'now' && 'Опубликовать сейчас'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Переключатели режимов */}
            <div className="space-y-3">
                {bulkVisible && (
                    <div className={`flex items-center gap-3 p-4 bg-white rounded-lg border ${
                        bulkEnabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
                    }`}>
                        <button
                            onClick={handleBulkToggle}
                            disabled={!bulkEnabled}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors disabled:opacity-50 flex-shrink-0 ${
                                isBulkMode ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isBulkMode ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <label className={`text-sm font-medium text-gray-700 ${!bulkEnabled ? 'opacity-50' : ''}`}>
                            Создать несколько постов
                        </label>
                        {!bulkEnabled && isCyclic && (
                            <span className="ml-auto text-xs text-red-600">🔒 Заблокировано циклической публикацией</span>
                        )}
                    </div>
                )}

                <div className={`flex items-center gap-3 p-4 bg-white rounded-lg border ${
                    cyclicEnabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
                }`}>
                    <button
                        onClick={handleCyclicToggle}
                        disabled={!cyclicEnabled}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors disabled:opacity-50 flex-shrink-0 ${
                            isCyclic ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            isCyclic ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                    <label className={`text-sm font-medium text-gray-700 ${!cyclicEnabled ? 'opacity-50' : ''}`}>
                        Циклическая публикация
                    </label>
                    {!cyclicEnabled && (
                        <span className="ml-auto text-xs text-red-600">🔒 Недоступно при "Опубликовать сейчас"</span>
                    )}
                </div>
            </div>

            {/* Статус совместимости */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Текущее состояние:</p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    <li>Способ публикации: <strong>{
                        publicationMethod === 'system' ? 'Через систему' :
                        publicationMethod === 'vk' ? 'В отложку VK' : 'Опубликовать сейчас'
                    }</strong></li>
                    <li>Массовое создание: {bulkVisible ? (isBulkMode ? '✅ Включено' : '⭕ Выключено') : '❌ Скрыто'}</li>
                    <li>Циклическая публикация: {isCyclic ? '✅ Включена' : '⭕ Выключена'}</li>
                </ul>
                {publicationMethod === 'now' && (
                    <p className="mt-3 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                        ⚠️ При выборе "Опубликовать сейчас" оба режима автоматически выключаются и скрываются
                    </p>
                )}
                {isCyclic && (
                    <p className="mt-3 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                        🚫 Массовое создание и циклическая публикация взаимоисключающие — может быть включён только один из них
                    </p>
                )}
            </div>
        </div>
    );
};
