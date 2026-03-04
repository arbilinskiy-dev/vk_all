import React, { useState } from 'react';

// =====================================================================
// Mock-компоненты для страницы "Способ публикации"
// =====================================================================

// Mock: Селектор способа публикации
export const PublicationMethodSelector: React.FC = () => {
    const [method, setMethod] = useState<'system' | 'vk' | 'now'>('system');
    const [isFutureDate, setIsFutureDate] = useState(false);

    const buttonBaseClass = 'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
    const activeClass = 'bg-white shadow text-indigo-700';
    const inactiveClass = 'text-gray-600 hover:bg-gray-100';
    const disabledClass = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400';

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                    type="checkbox"
                    id="futureDate"
                    checked={isFutureDate}
                    onChange={(e) => {
                        setIsFutureDate(e.target.checked);
                        if (e.target.checked && method === 'now') {
                            setMethod('system');
                        }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="futureDate" className="text-sm text-gray-700">
                    Дата в будущем (блокирует "Опубликовать сейчас")
                </label>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Способ публикации</label>
                <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                    <button
                        onClick={() => setMethod('system')}
                        className={`${buttonBaseClass} ${method === 'system' ? activeClass : inactiveClass}`}
                    >
                        Запланировать
                    </button>
                    <button
                        onClick={() => setMethod('vk')}
                        className={`${buttonBaseClass} ${method === 'vk' ? activeClass : inactiveClass}`}
                    >
                        В отложку VK
                    </button>
                    <button
                        onClick={() => setMethod('now')}
                        disabled={isFutureDate}
                        className={`${buttonBaseClass} ${method === 'now' ? activeClass : inactiveClass} ${disabledClass}`}
                    >
                        Опубликовать сейчас
                    </button>
                </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="font-semibold text-blue-900 mb-2">Выбрано:</p>
                <p className="text-blue-800">
                    {method === 'system' && '📅 Запланировать — пост сохраняется в БД приложения'}
                    {method === 'vk' && '⏰ В отложку VK — пост отправляется в отложенные записи VK'}
                    {method === 'now' && '⚡ Опубликовать сейчас — пост публикуется немедленно на стену VK'}
                </p>
            </div>
        </div>
    );
};

// =====================================================================
// Mock: Изменение текста кнопки Save в зависимости от метода
// =====================================================================
export const SaveButtonTextDemo: React.FC = () => {
    const [method, setMethod] = useState<'system' | 'vk' | 'now'>('system');
    const [postCount, setPostCount] = useState(1);
    const [isUploading, setIsUploading] = useState(false);

    const getSaveButtonText = () => {
        if (isUploading) {
            return 'Загрузка...';
        }
        let text = '';
        if (method === 'now') {
            text = 'Опубликовать';
        } else if (method === 'vk') {
            text = 'В отложку VK';
        } else {
            text = 'Запланировать';
        }
        return postCount > 1 ? `${text} (${postCount})` : text;
    };

    const buttonBaseClass = 'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
    const activeClass = 'bg-white shadow text-indigo-700';
    const inactiveClass = 'text-gray-600 hover:bg-gray-100';

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Способ публикации</label>
                <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                    <button
                        onClick={() => setMethod('system')}
                        className={`${buttonBaseClass} ${method === 'system' ? activeClass : inactiveClass}`}
                    >
                        Запланировать
                    </button>
                    <button
                        onClick={() => setMethod('vk')}
                        className={`${buttonBaseClass} ${method === 'vk' ? activeClass : inactiveClass}`}
                    >
                        В отложку VK
                    </button>
                    <button
                        onClick={() => setMethod('now')}
                        className={`${buttonBaseClass} ${method === 'now' ? activeClass : inactiveClass}`}
                    >
                        Опубликовать сейчас
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Количество постов (проектов)</label>
                <input
                    type="number"
                    min="1"
                    max="20"
                    value={postCount}
                    onChange={(e) => setPostCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                    type="checkbox"
                    id="uploading"
                    checked={isUploading}
                    onChange={(e) => setIsUploading(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="uploading" className="text-sm text-gray-700">
                    Загрузка медиа (блокирует сохранение)
                </label>
            </div>

            <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3">Кнопка "Сохранить" в футере:</p>
                <button
                    disabled={isUploading}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isUploading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {getSaveButtonText()}
                </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                💡 <strong>Динамический текст:</strong> Кнопка меняет текст в зависимости от способа публикации, 
                добавляет счётчик при мультипроекте и показывает "Загрузка..." во время загрузки медиа
            </div>
        </div>
    );
};

// =====================================================================
// Mock: Взаимодействие с датой/временем
// =====================================================================
export const DateTimeInteractionDemo: React.FC = () => {
    const [method, setMethod] = useState<'system' | 'vk' | 'now'>('system');

    const buttonBaseClass = 'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
    const activeClass = 'bg-white shadow text-indigo-700';
    const inactiveClass = 'text-gray-600 hover:bg-gray-100';

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Способ публикации</label>
                <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                    <button
                        onClick={() => setMethod('system')}
                        className={`${buttonBaseClass} ${method === 'system' ? activeClass : inactiveClass}`}
                    >
                        Запланировать
                    </button>
                    <button
                        onClick={() => setMethod('vk')}
                        className={`${buttonBaseClass} ${method === 'vk' ? activeClass : inactiveClass}`}
                    >
                        В отложку VK
                    </button>
                    <button
                        onClick={() => setMethod('now')}
                        className={`${buttonBaseClass} ${method === 'now' ? activeClass : inactiveClass}`}
                    >
                        Опубликовать сейчас
                    </button>
                </div>
            </div>

            {method === 'now' ? (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">⚡ Пикер даты/времени скрыт</p>
                    <p className="text-sm text-yellow-800">
                        При выборе "Опубликовать сейчас" пикер полностью исчезает — дата и время 
                        устанавливаются автоматически как текущий момент
                    </p>
                </div>
            ) : (
                <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата и время публикации</label>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="date"
                            defaultValue="2026-02-15"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="time"
                            defaultValue="14:00"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        📅 Пикер доступен для методов "Запланировать" и "В отложку VK"
                    </p>
                </div>
            )}
        </div>
    );
};

// =====================================================================
// Mock: Зависимость опций от метода публикации
// =====================================================================
export const OptionsDependendyDemo: React.FC = () => {
    const [method, setMethod] = useState<'system' | 'vk' | 'now'>('system');
    const [isBulk, setIsBulk] = useState(false);
    const [isCyclic, setIsCyclic] = useState(false);
    const [isMultiproject, setIsMultiproject] = useState(false);

    const buttonBaseClass = 'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
    const activeClass = 'bg-white shadow text-indigo-700';
    const inactiveClass = 'text-gray-600 hover:bg-gray-100';

    // Сайд-эффекты при смене метода
    const handleMethodChange = (newMethod: 'system' | 'vk' | 'now') => {
        setMethod(newMethod);
        if (newMethod === 'now') {
            setIsBulk(false);
            setIsCyclic(false);
        } else if (newMethod === 'vk') {
            setIsCyclic(false);
        }
    };

    const bulkAvailable = method !== 'now';
    const cyclicAvailable = method === 'system';

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Способ публикации</label>
                <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                    <button
                        onClick={() => handleMethodChange('system')}
                        className={`${buttonBaseClass} ${method === 'system' ? activeClass : inactiveClass}`}
                    >
                        Запланировать
                    </button>
                    <button
                        onClick={() => handleMethodChange('vk')}
                        className={`${buttonBaseClass} ${method === 'vk' ? activeClass : inactiveClass}`}
                    >
                        В отложку VK
                    </button>
                    <button
                        onClick={() => handleMethodChange('now')}
                        className={`${buttonBaseClass} ${method === 'now' ? activeClass : inactiveClass}`}
                    >
                        Опубликовать сейчас
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white border-2 border-gray-300 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Опции создания постов:</p>

                {/* Массовое создание */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                    bulkAvailable ? 'bg-gray-50' : 'bg-gray-100'
                }`}>
                    <span className={`text-sm ${bulkAvailable ? 'text-gray-700' : 'text-gray-400'}`}>
                        Массовое создание
                    </span>
                    <button
                        onClick={() => bulkAvailable && setIsBulk(!isBulk)}
                        disabled={!bulkAvailable}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
                            isBulk && bulkAvailable ? 'bg-indigo-600' : 'bg-gray-300'
                        } ${!bulkAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isBulk && bulkAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Циклическая публикация */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                    cyclicAvailable ? 'bg-gray-50' : 'bg-gray-100'
                }`}>
                    <span className={`text-sm ${cyclicAvailable ? 'text-gray-700' : 'text-gray-400'}`}>
                        Циклическая публикация
                    </span>
                    <button
                        onClick={() => cyclicAvailable && setIsCyclic(!isCyclic)}
                        disabled={!cyclicAvailable}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
                            isCyclic && cyclicAvailable ? 'bg-indigo-600' : 'bg-gray-300'
                        } ${!cyclicAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isCyclic && cyclicAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Мультипроект */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Мультипроектная публикация</span>
                    <button
                        onClick={() => setIsMultiproject(!isMultiproject)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
                            isMultiproject ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isMultiproject ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                <p className="font-semibold mb-1">Текущий метод: {
                    method === 'system' ? 'Запланировать' : 
                    method === 'vk' ? 'В отложку VK' : 
                    'Опубликовать сейчас'
                }</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Массовое создание: {bulkAvailable ? '✅ Доступно' : '❌ Заблокировано'}</li>
                    <li>Циклическая публикация: {cyclicAvailable ? '✅ Доступно' : '❌ Заблокировано'}</li>
                    <li>Мультипроект: ✅ Всегда доступно</li>
                </ul>
            </div>
        </div>
    );
};
