import React, { useState } from 'react';

// =====================================================================
// Mock-компоненты для страницы "Мультипроектная публикация"
// =====================================================================

// Демонстрация переключателя мультипроектной публикации
export const MultiProjectToggleDemo: React.FC = () => {
    const [isMultiProjectMode, setIsMultiProjectMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="space-y-6">
            {/* Кнопка имитации сохранения */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

            {/* Переключатель мультипроекта */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <button
                    type="button"
                    onClick={() => !isSaving && setIsMultiProjectMode(!isMultiProjectMode)}
                    disabled={isSaving}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors disabled:opacity-50 flex-shrink-0 ${
                        isMultiProjectMode ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        isMultiProjectMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
                <label 
                    onClick={() => !isSaving && setIsMultiProjectMode(!isMultiProjectMode)}
                    className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                    Мультипроектная публикация
                </label>
            </div>

            {/* Статус */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">Текущее состояние:</p>
                <ul className="list-disc list-inside mt-2 text-sm text-blue-800 space-y-1">
                    <li>Мультипроект: {isMultiProjectMode ? '✅ Включён' : '❌ Выключен'}</li>
                    <li>Сохранение: {isSaving ? '⏳ В процессе...' : '✅ Готов'}</li>
                    <li>Переключатель: {isSaving ? '🔒 Заблокирован' : '🔓 Активен'}</li>
                </ul>
            </div>
        </div>
    );
};

// Демонстрация селектора проектов
export const MultiProjectSelectorDemo: React.FC = () => {
    const mockProjects = [
        { id: '1', name: 'Кофейня "Бодрость"', team: 'Команда А', isCurrent: true },
        { id: '2', name: 'Фитнес-клуб "Энергия"', team: 'Команда А', isCurrent: false },
        { id: '3', name: 'Салон красоты "Стиль"', team: 'Команда Б', isCurrent: false },
        { id: '4', name: 'Ресторан "Вкусно&Точка"', team: 'Команда Б', isCurrent: false },
        { id: '5', name: 'Автосервис "Мастер"', team: 'Без команды', isCurrent: false },
        { id: '6', name: 'Книжный магазин "Читай-город"', team: 'Команда А', isCurrent: false },
        { id: '7', name: 'Детский сад "Радуга"', team: 'Команда Б', isCurrent: false },
        { id: '8', name: 'Пекарня "Хлебница"', team: 'Без команды', isCurrent: false }
    ];

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['1']));
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState<string>('All');

    const teams = ['Команда А', 'Команда Б', 'Без команды'];

    const filteredProjects = mockProjects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTeam = teamFilter === 'All' || p.team === teamFilter;
        return matchesSearch && matchesTeam;
    });

    const handleToggle = (id: string, isCurrent: boolean) => {
        if (isCurrent) return; // Текущий проект нельзя снять
        const newIds = new Set(selectedIds);
        if (newIds.has(id)) {
            newIds.delete(id);
        } else {
            newIds.add(id);
        }
        setSelectedIds(newIds);
    };

    const handleSelectAll = () => {
        const newIds = new Set(selectedIds);
        filteredProjects.forEach(p => newIds.add(p.id));
        setSelectedIds(newIds);
    };

    const handleDeselectAll = () => {
        const newIds = new Set<string>();
        // Текущий проект всегда остаётся
        newIds.add('1');
        setSelectedIds(newIds);
    };

    return (
        <div className="space-y-4 animate-fade-in-up">
            {/* Заголовок с счётчиком */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Выберите проекты:</h4>
                <span className="text-sm font-medium text-gray-600">Выбрано: {selectedIds.size}</span>
            </div>

            {/* Поиск */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Фильтры по командам */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setTeamFilter('All')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                        teamFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Все
                </button>
                {teams.map(team => (
                    <button
                        key={team}
                        onClick={() => setTeamFilter(team)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                            teamFilter === team ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {team}
                    </button>
                ))}
            </div>

            {/* Действия над списком */}
            <div className="flex gap-2 text-xs">
                <button onClick={handleSelectAll} className="text-indigo-600 hover:text-indigo-800">
                    Выбрать все видимые
                </button>
                <span>|</span>
                <button onClick={handleDeselectAll} className="text-indigo-600 hover:text-indigo-800">
                    Снять выделение
                </button>
            </div>

            {/* Список проектов (с прокруткой) */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded-md p-2 space-y-1 bg-white">
                {filteredProjects.map((project) => {
                    const isChecked = selectedIds.has(project.id);
                    return (
                        <label
                            key={project.id}
                            className={`flex items-center p-2 rounded-md cursor-pointer ${
                                project.isCurrent ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={project.isCurrent}
                                onChange={() => handleToggle(project.id, project.isCurrent)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                            />
                            <span className={`ml-3 text-sm font-medium ${
                                project.isCurrent ? 'text-gray-500' : 'text-gray-800'
                            }`}>
                                {project.name}
                                {project.isCurrent && ' (текущий проект)'}
                            </span>
                        </label>
                    );
                })}
                {filteredProjects.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Ничего не найдено</p>
                )}
            </div>

            {/* Подсказка */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                    💡 <strong>Текущий проект</strong> (из которого открыта модалка) всегда выбран и не может быть снят
                </p>
            </div>
        </div>
    );
};

// Калькулятор подсчёта постов с мультипроектом
export const MultiProjectPostCountDemo: React.FC = () => {
    const [projectCount, setProjectCount] = useState(3);
    const [dateCount, setDateCount] = useState(2);
    const [isMultiProject, setIsMultiProject] = useState(true);
    const [isBulk, setIsBulk] = useState(true);

    const totalPosts = (isMultiProject ? projectCount : 1) * (isBulk ? dateCount : 1);

    return (
        <div className="space-y-6">
            {/* Переключатели */}
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
                            onClick={() => setIsBulk(!isBulk)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${
                                isBulk ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                isBulk ? 'translate-x-6' : 'translate-x-1'
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
                        disabled={!isBulk}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Формула и результат */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Формула расчёта:</p>
                <div className="font-mono text-sm text-gray-800 mb-4">
                    postCount = ({isMultiProject ? projectCount : <span className="text-gray-400">1</span>}) × ({isBulk ? dateCount : <span className="text-gray-400">1</span>})
                </div>
                <div className="text-center">
                    <p className="text-4xl font-bold text-green-700">{totalPosts}</p>
                    <p className="text-sm text-green-600 mt-1">
                        {totalPosts === 1 ? 'пост' : totalPosts < 5 ? 'поста' : 'постов'} будет создано
                    </p>
                </div>
            </div>

            {/* Пример кнопки */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Так будет выглядеть кнопка сохранения:</p>
                <button className="w-full px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700">
                    {totalPosts > 1 ? `Запланировать (${totalPosts})` : 'Запланировать'}
                </button>
            </div>
        </div>
    );
};

// Демонстрация логики параллельного сохранения
export const MultiProjectSaveDemo: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [progress, setProgress] = useState<{ project: string; status: 'pending' | 'success' | 'error' }[]>([]);

    const mockProjects = ['Кофейня "Бодрость"', 'Фитнес-клуб "Энергия"', 'Салон красоты "Стиль"'];
    const mockDates = ['15 марта, 10:00', '16 марта, 10:00'];

    const handleSave = async () => {
        setIsSaving(true);
        const allCombinations = mockProjects.flatMap(project => 
            mockDates.map(date => ({ project, date }))
        );

        const initialProgress = allCombinations.map((combo, idx) => ({
            project: `${combo.project} → ${combo.date}`,
            status: 'pending' as const
        }));
        setProgress(initialProgress);

        // Имитация параллельного сохранения
        await new Promise(resolve => setTimeout(resolve, 500));

        for (let i = 0; i < initialProgress.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            setProgress(prev => prev.map((item, idx) => 
                idx === i ? { ...item, status: Math.random() > 0.1 ? 'success' as const : 'error' as const } : item
            ));
        }

        setIsSaving(false);
    };

    return (
        <div className="space-y-4">
            {/* Сценарий */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Сценарий:</p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    <li>{mockProjects.length} проектов × {mockDates.length} даты = <strong>{mockProjects.length * mockDates.length} постов</strong></li>
                    <li>Все посты создаются <strong>параллельно</strong> (Promise.allSettled)</li>
                    <li>Ошибка в одном посте не прерывает сохранение остальных</li>
                </ul>
            </div>

            {/* Кнопка запуска */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? 'Сохранение...' : `Запланировать (${mockProjects.length * mockDates.length})`}
            </button>

            {/* Прогресс */}
            {progress.length > 0 && (
                <div className="border rounded-md p-3 bg-white space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {progress.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                            {item.status === 'pending' && <span className="text-gray-400">⏳</span>}
                            {item.status === 'success' && <span className="text-green-600">✅</span>}
                            {item.status === 'error' && <span className="text-red-600">❌</span>}
                            <span className={
                                item.status === 'success' ? 'text-green-700' : 
                                item.status === 'error' ? 'text-red-700' : 'text-gray-600'
                            }>
                                {item.project}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Итог */}
            {!isSaving && progress.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                        ✅ Создано: {progress.filter(p => p.status === 'success').length} из {progress.length} постов
                        {progress.some(p => p.status === 'error') && (
                            <span className="block mt-1 text-red-700">⚠️ Некоторые посты не удалось создать</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};
