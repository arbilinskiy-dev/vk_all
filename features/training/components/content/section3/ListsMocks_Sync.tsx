import React from 'react';

// =====================================================================
// КОМПОНЕНТЫ ДЛЯ СТРАНИЦЫ "СИНХРОНИЗАЦИЯ ВЗАИМОДЕЙСТВИЙ" (3.2.6)
// =====================================================================

// 1. Демонстрация карточки списка с кнопкой refresh
export const SyncInteractionsButtonDemo: React.FC = () => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div className="max-w-sm">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative">
                {/* Аннотация */}
                <div className="absolute -top-3 -right-3 bg-purple-100 border-2 border-purple-400 rounded-full px-3 py-1 text-xs font-bold text-purple-700 animate-pulse">
                    Кнопка здесь!
                </div>

                {/* Заголовок карточки */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <h3 className="text-sm font-semibold text-gray-700">Лайкали</h3>
                    </div>
                    <button
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`p-1.5 rounded-md transition-colors ${
                            isHovered ? 'bg-gray-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title="Собрать взаимодействия"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Счётчик */}
                <div className="text-3xl font-bold text-gray-800 mb-1">156</div>
                <div className="text-xs text-gray-500">Обновлено: 25.02, 14:30</div>
            </div>
        </div>
    );
};

// 2. Полное модальное окно синхронизации (интерактивное)
export const InteractionSyncModalDemo: React.FC = () => {
    const [dateFrom, setDateFrom] = React.useState(() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = React.useState(() => new Date().toISOString().split('T')[0]);
    const [isSyncing, setIsSyncing] = React.useState(false);

    const handlePreset = (days: number) => {
        const today = new Date();
        const fromDate = new Date();
        if (days === 365 * 2) {
            // Прошлый год
            fromDate.setFullYear(today.getFullYear() - 1, 0, 1);
            const toDate = new Date(today.getFullYear() - 1, 11, 31);
            setDateFrom(fromDate.toISOString().split('T')[0]);
            setDateTo(toDate.toISOString().split('T')[0]);
        } else {
            fromDate.setDate(today.getDate() - days);
            setDateFrom(fromDate.toISOString().split('T')[0]);
            setDateTo(today.toISOString().split('T')[0]);
        }
    };

    const handleStart = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            alert('Синхронизация завершена! (демонстрация)');
        }, 2000);
    };

    const hasError = new Date(dateFrom) > new Date(dateTo);

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Сбор активностей</h3>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <p className="text-sm text-gray-600">
                    Выберите период, за который нужно собрать лайки, комментарии и репосты со стены сообщества.
                </p>

                {/* Preset кнопки */}
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handlePreset(7)} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-gray-200 transition-colors">
                            Неделя
                        </button>
                        <button onClick={() => handlePreset(30)} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-gray-200 transition-colors">
                            Месяц
                        </button>
                        <button onClick={() => handlePreset(90)} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-gray-200 transition-colors">
                            Квартал
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handlePreset(180)} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-gray-200 transition-colors whitespace-nowrap">
                            Полгода
                        </button>
                        <button onClick={() => handlePreset(365)} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-gray-200 transition-colors">
                            Год
                        </button>
                        <button onClick={() => handlePreset(365 * 2)} className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-gray-200 transition-colors whitespace-nowrap">
                            Прошлый год
                        </button>
                    </div>
                </div>

                {/* Date pickers */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">С</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            max={dateTo}
                            className="w-full border rounded px-3 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">По</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            min={dateFrom}
                            className="w-full border rounded px-3 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Ошибка валидации */}
                {hasError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        Дата начала не может быть позже даты окончания.
                    </div>
                )}

                {/* Информационный блок */}
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-100">
                    <p className="font-medium text-blue-800 mb-1">Важно:</p>
                    <ul className="space-y-1">
                        <li>• Сбор репостов требует прав администратора.</li>
                        <li>• Обновляются данные сразу во всех списках (Лайкали, Комментировали, Репостили).</li>
                        <li>• При выборе большого периода (год и более) процесс может занять несколько минут.</li>
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                    disabled={isSyncing}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                    Отмена
                </button>
                <button
                    onClick={handleStart}
                    disabled={isSyncing || hasError}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center"
                >
                    {isSyncing && <div className="loader border-white border-t-transparent h-4 w-4 mr-2"></div>}
                    {isSyncing ? 'Сбор данных...' : 'Запустить'}
                </button>
            </div>
        </div>
    );
};

// 3. Демонстрация фаз прогресса синхронизации
export const SyncProgressStatesDemo: React.FC = () => {
    const [currentPhase, setCurrentPhase] = React.useState(0);

    const phases = [
        { label: 'Старт', description: 'Подготовка, сбор токенов, получение списка постов' },
        { label: '15/50', description: 'Сбор данных с VK API — обработано 15 из 50 постов' },
        { label: 'Запись', description: 'Сохранение собранных данных в базу данных' },
        { label: 'Готово', description: 'Синхронизация завершена успешно' },
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhase((prev) => (prev + 1) % phases.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            {/* Визуализация на кнопке */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Состояние на кнопке refresh:</p>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center h-9 px-3 bg-white border border-gray-300 rounded-md text-gray-600 shadow-sm">
                        <div className="flex items-center gap-1">
                            <div className="loader h-4 w-4 border-2 border-gray-400 border-t-indigo-500"></div>
                            <span className="text-xs text-gray-500">{phases[currentPhase].label}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Таблица фаз */}
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Фаза</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Что происходит</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {phases.map((phase, idx) => (
                        <tr key={idx} className={currentPhase === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-3">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                                    {phase.label}
                                </code>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{phase.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 4. Сравнение результатов до/после синхронизации
export const SyncResultsComparisonDemo: React.FC = () => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* До синхронизации */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-3">До синхронизации</div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Лайкали</span>
                        <span className="text-2xl font-bold text-gray-400">—</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Комментировали</span>
                        <span className="text-2xl font-bold text-gray-400">—</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Репостили</span>
                        <span className="text-2xl font-bold text-gray-400">—</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-3">Обновлено: —</div>
                </div>
            </div>

            {/* После синхронизации */}
            <div className="bg-white rounded-lg border-2 border-green-400 p-4">
                <div className="text-xs font-semibold text-green-700 uppercase mb-3">После синхронизации</div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Лайкали</span>
                        <span className="text-2xl font-bold text-green-600">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Комментировали</span>
                        <span className="text-2xl font-bold text-green-600">42</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Репостили</span>
                        <span className="text-2xl font-bold text-green-600">8</span>
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-3">Обновлено: 25.02, 14:30</div>
                </div>
            </div>
        </div>
    );
};

// 5. Примеры ошибок синхронизации
export const SyncErrorsDemo: React.FC = () => {
    const errors = [
        {
            type: 'Нет админских прав',
            message: 'Нет токенов с правами администратора для сбора репостов.',
            solution: 'Добавьте токен администратора в настройках проекта',
            color: 'red',
        },
        {
            type: 'Неверный период',
            message: 'Дата начала не может быть позже даты окончания.',
            solution: 'Проверьте выбранные даты в модальном окне',
            color: 'orange',
        },
        {
            type: 'Проект не найден',
            message: 'Project not found',
            solution: 'Проект был удалён или у вас нет доступа',
            color: 'red',
        },
    ];

    return (
        <div className="space-y-3">
            {errors.map((error, idx) => (
                <div key={idx} className={`bg-${error.color}-50 border border-${error.color}-200 rounded-lg p-4`}>
                    <div className="flex items-start gap-3">
                        <svg className={`h-5 w-5 text-${error.color}-600 flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <h4 className={`font-semibold text-${error.color}-900 mb-1`}>{error.type}</h4>
                            <p className={`text-sm text-${error.color}-700 mb-2`}>{error.message}</p>
                            <p className={`text-xs text-${error.color}-600`}>
                                <strong>Решение:</strong> {error.solution}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 6. Сравнение двух кнопок: синхронизация vs обновление профилей
export const TwoButtonsComparisonDemo: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Кнопка синхронизации */}
                <div className="bg-white rounded-lg border-2 border-indigo-300 p-4">
                    <div className="flex items-center justify-center mb-3">
                        <button className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <h4 className="font-semibold text-indigo-900 text-center mb-2">Синхронизация взаимодействий</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Собирает новые лайки/комментарии/репосты</li>
                        <li>✓ Требует выбор периода</li>
                        <li>✓ Обновляет все 3 списка сразу</li>
                        <li>✓ 3-10 минут выполнения</li>
                    </ul>
                </div>

                {/* Кнопка обновления профилей */}
                <div className="bg-white rounded-lg border-2 border-green-300 p-4">
                    <div className="flex items-center justify-center mb-3">
                        <button className="flex items-center justify-center h-9 px-3 bg-white border border-gray-300 rounded-md text-gray-600 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <h4 className="font-semibold text-green-900 text-center mb-2">Обновление профилей</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Обновляет только данные профилей</li>
                        <li>✓ Не требует выбор периода</li>
                        <li>✓ Быстрая операция (до 1 минуты)</li>
                        <li>✓ City, bdate, platform, статусы</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// 7. Визуализация трёх типов взаимодействий
export const InteractionTypesDemo: React.FC = () => {
    const types = [
        {
            name: 'Лайки',
            icon: '❤️',
            color: 'red',
            api: 'likes.getList',
            description: 'Кто лайкнул посты сообщества',
            limit: '1000 за пост (быстрый сбор)',
        },
        {
            name: 'Комментарии',
            icon: '💬',
            color: 'blue',
            api: 'wall.getComments',
            description: 'Кто комментировал посты',
            limit: '100 за пост (быстрый сбор)',
        },
        {
            name: 'Репосты',
            icon: '🔄',
            color: 'green',
            api: 'wall.getReposts',
            description: 'Кто репостил записи',
            limit: '1000 за пост (требуются админские права)',
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {types.map((type, idx) => (
                <div key={idx} className={`bg-${type.color}-50 border border-${type.color}-200 rounded-lg p-4 text-center`}>
                    <div className="text-4xl mb-2">{type.icon}</div>
                    <h4 className={`font-bold text-${type.color}-900 mb-2`}>{type.name}</h4>
                    <p className="text-xs text-gray-600 mb-3">{type.description}</p>
                    <div className={`text-xs bg-${type.color}-100 text-${type.color}-800 px-2 py-1 rounded mb-2`}>
                        <code>{type.api}</code>
                    </div>
                    <p className="text-xs text-gray-500">{type.limit}</p>
                </div>
            ))}
        </div>
    );
};

// 8. Выбор периода с preset'ами (интерактивный)
export const DatePeriodPickerDemo: React.FC = () => {
    const [selectedPreset, setSelectedPreset] = React.useState<string | null>('week');

    const presets = [
        { id: 'week', label: 'Неделя', days: 7 },
        { id: 'month', label: 'Месяц', days: 30 },
        { id: 'quarter', label: 'Квартал', days: 90 },
        { id: 'halfyear', label: 'Полгода', days: 180 },
        { id: 'year', label: 'Год', days: 365 },
        { id: 'lastyear', label: 'Прошлый год', days: 0, special: true },
    ];

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600">Нажмите на preset, чтобы быстро выбрать период:</p>
            <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    {presets.slice(0, 3).map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => setSelectedPreset(preset.id)}
                            className={`py-2 text-xs font-medium rounded border transition-colors ${
                                selectedPreset === preset.id
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {presets.slice(3).map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => setSelectedPreset(preset.id)}
                            className={`py-2 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                                selectedPreset === preset.id
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Результат выбора */}
            {selectedPreset && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-indigo-900 mb-1">Выбранный период:</p>
                    <p className="text-sm text-indigo-700">
                        {presets.find(p => p.id === selectedPreset)?.special
                            ? 'С 1 января по 31 декабря прошлого года'
                            : `Последние ${presets.find(p => p.id === selectedPreset)?.days} дней`}
                    </p>
                </div>
            )}
        </div>
    );
};
