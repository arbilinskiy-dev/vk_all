import React, { useState } from 'react';
import { Sandbox } from '../shared';

// =====================================================================
// Интерактивный макет сайдбара (Sandbox-секция)
// Содержит всю интерактивную логику: фильтры, поиск, свёрнутые секции
// =====================================================================
export const SidebarNavOverview_Sandbox: React.FC = () => {
    // State для интерактивности макета
    const [activeTeam, setActiveTeam] = useState('Все');
    const [activeContentFilter, setActiveContentFilter] = useState('Все');
    const [showDisabled, setShowDisabled] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как это выглядит?</h2>

            <Sandbox
                title="Интерактивный макет сайдбара"
                description="Попробуй взаимодействовать с фильтрами и кнопками — они работают как в реальном приложении."
                instructions={["Кликай на кнопки фильтров команд и контента, вводи текст в поиск, сворачивай секцию отключённых проектов."]}
            >
            <div className="not-prose bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                    <strong>📋 Структура сайдбара:</strong> Ниже показана точная структура всех элементов. 
                    Данные (названия проектов, имя пользователя) загружаются из базы данных при работе приложения.
                    <br /><br />
                    <strong>Важно:</strong> Фильтры по количеству постов показаны здесь для примера, но в реальном приложении 
                    они появляются <strong>только на вкладках "Отложенные" и "Предложенные"</strong>. 
                    На вкладке "Товары" этих фильтров нет.
                </p>
            </div>

            <div className="not-prose bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4 font-semibold">Полная структура сайдбара проектов:</p>
                
                <div className="space-y-2">
                    {/* Шапка сайдбара */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Проекты</h2>
                        <div className="flex items-center gap-1">
                            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800" title="Глобальное обновление всех проектов" aria-label="Глобальное обновление всех проектов">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                            </button>
                            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800" title="Обновить список проектов" aria-label="Обновить список проектов">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Фильтры и поиск */}
                    <div className="p-3 space-y-4 border-b border-gray-200">
                        <input 
                            type="text" 
                            placeholder="Поиск по названию..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Команды <span className="text-[10px] normal-case font-normal text-gray-400">(список зависит от ваших проектов)</span></h4>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                <button 
                                    onClick={() => setActiveTeam('Все')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 ${activeTeam === 'Все' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    Все
                                </button>
                                <button 
                                    onClick={() => setActiveTeam('В')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 ${activeTeam === 'В' ? 'ring-2 ring-indigo-500' : ''}`}
                                    aria-label="Фильтр по команде В"
                                >
                                    В
                                </button>
                                <button 
                                    onClick={() => setActiveTeam('С')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 ${activeTeam === 'С' ? 'ring-2 ring-indigo-500' : ''}`}
                                    aria-label="Фильтр по команде С"
                                >
                                    С
                                </button>
                                <button 
                                    onClick={() => setActiveTeam('A')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 ${activeTeam === 'A' ? 'ring-2 ring-indigo-500' : ''}`}
                                    aria-label="Фильтр по команде A"
                                >
                                    A
                                </button>
                                <button 
                                    onClick={() => setActiveTeam('Без команды')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 ${activeTeam === 'Без команды' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    Без команды
                                </button>
                            </div>
                        </div>

                        {/* Условные фильтры контента (показываются только на вкладках Отложенные/Предложенные) */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Отложенные посты <span className="text-[10px] normal-case font-normal text-gray-400">(или "Предложенные" на другой вкладке)</span></h4>
                        <div className="flex flex-wrap gap-1.5">
                                <button 
                                    onClick={() => setActiveContentFilter('Все')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gray-300 text-gray-800 transition-colors ${activeContentFilter === 'Все' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    Все
                                </button>
                                <button 
                                    onClick={() => setActiveContentFilter('Нет постов')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-t from-gray-300 to-red-200 text-red-900 transition-colors ${activeContentFilter === 'Нет постов' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    Нет постов
                                </button>
                                <button 
                                    onClick={() => setActiveContentFilter('Есть посты')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-t from-gray-300 to-blue-200 text-blue-900 transition-colors ${activeContentFilter === 'Есть посты' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    Есть посты
                                </button>
                                <button 
                                    onClick={() => setActiveContentFilter('< 5')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 transition-colors ${activeContentFilter === '< 5' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    &lt; 5
                                </button>
                                <button 
                                    onClick={() => setActiveContentFilter('5-10')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gray-300 text-gray-800 transition-colors ${activeContentFilter === '5-10' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    5-10
                                </button>
                                <button 
                                    onClick={() => setActiveContentFilter('> 10')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-t from-gray-300 to-green-200 text-green-900 transition-colors ${activeContentFilter === '> 10' ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    &gt; 10
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Список проектов */}
                    <div className="bg-white p-2">
                        <p className="text-xs text-gray-500 italic px-2">Здесь отображаются все активные проекты...</p>
                    </div>

                    {/* Отключённые проекты */}
                    <div className="flex justify-between items-center px-4 pt-4 pb-2 mt-2 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Отключенные</h4>
                        <button 
                            onClick={() => setShowDisabled(!showDisabled)}
                            className="p-1 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700" 
                            title={showDisabled ? "Скрыть" : "Показать"}
                            aria-label={showDisabled ? "Скрыть отключённые проекты" : "Показать отключённые проекты"}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                {showDisabled ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-2.572 4.293m-5.466-4.293a3 3 0 01-4.242-4.242" />
                                ) : (
                                    <>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                    {showDisabled && (
                        <div className="px-4">
                            <p className="text-xs text-gray-500 italic">Список отключенных проектов (если есть)</p>
                        </div>
                    )}

                    {/* Блок пользователя */}
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 text-sm font-medium">A</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">admin</p>
                                <p className="text-xs text-gray-500">Администратор</p>
                            </div>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors" title="Выйти" aria-label="Выйти из системы">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                        {/* Версия бэкенда */}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-[10px] text-gray-400 font-mono truncate" title="Backend: v1.0.46_fix_community_token">
                                Backend: v1.0.46_fix_community_token
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-600 mt-4">
                    <strong>Важно:</strong> Блок пользователя внизу не скроллится — он всегда виден. 
                    Список проектов можно прокручивать, а блок с именем прибит к низу.
                </p>
            </div>
            </Sandbox>
        </>
    );
};
