import React, { useState } from 'react';
import { updatesData, ReleaseUpdate, UpdateEntry, KnownIssue, ImpactType } from '../data/updatesData';

// =====================================================================
// Иконки
// =====================================================================

/** Шеврон (стрелка вправо / вниз) для аккордеона */
const ChevronIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className = '' }) => (
    <svg
        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${className}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

/** Иконка предупреждения (для known issues) */
const WarningIcon: React.FC = () => (
    <svg className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
);

const BugfixIcon: React.FC = () => (
    <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
);

const FeatureIcon: React.FC = () => (
    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const ImprovementIcon: React.FC = () => (
    <svg className="h-5 w-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const getTypeIcon = (type: UpdateEntry['type']) => {
    switch (type) {
        case 'bugfix': return <BugfixIcon />;
        case 'feature': return <FeatureIcon />;
        case 'improvement': return <ImprovementIcon />;
    }
};

const getTypeLabel = (type: UpdateEntry['type']) => {
    switch (type) {
        case 'bugfix': return 'Исправление';
        case 'feature': return 'Новая возможность';
        case 'improvement': return 'Улучшение';
    }
};

const getTypeBadgeColor = (type: UpdateEntry['type']) => {
    switch (type) {
        case 'bugfix': return 'bg-red-100 text-red-700';
        case 'feature': return 'bg-green-100 text-green-700';
        case 'improvement': return 'bg-blue-100 text-blue-700';
    }
};

// =====================================================================
// Группировка записей по разделу приложения (section)
// =====================================================================

/** Группирует записи по полю section. Записи без section попадают в группу "Общее" */
const groupBySection = (entries: UpdateEntry[]): { section: string; entries: UpdateEntry[] }[] => {
    const map = new Map<string, UpdateEntry[]>();
    for (const entry of entries) {
        const key = entry.section || 'Общее';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(entry);
    }
    return Array.from(map.entries()).map(([section, items]) => ({ section, entries: items }));
};

/** Цвет левой полоски карточки по типу */
const getTypeBorderColor = (type: UpdateEntry['type']) => {
    switch (type) {
        case 'bugfix': return 'border-l-red-400';
        case 'feature': return 'border-l-green-400';
        case 'improvement': return 'border-l-blue-400';
    }
};

/** Метка типа влияния на систему */
const getImpactLabel = (impactType: ImpactType) => {
    switch (impactType) {
        case 'visual': return 'Визуальное';
        case 'logic': return 'Серверное';
        case 'both': return 'Визуальное + Серверное';
    }
};

/** Цвета бейджа типа влияния */
const getImpactBadgeStyle = (impactType: ImpactType) => {
    switch (impactType) {
        case 'visual': return 'bg-purple-100 text-purple-700';
        case 'logic': return 'bg-orange-100 text-orange-700';
        case 'both': return 'bg-teal-100 text-teal-700';
    }
};

/** Иконка типа влияния */
const getImpactIcon = (impactType: ImpactType) => {
    switch (impactType) {
        case 'visual': return '🎨';
        case 'logic': return '⚙️';
        case 'both': return '🔄';
    }
};

// =====================================================================
// Блок «Известные ограничения»
// =====================================================================
const KnownIssuesBlock: React.FC<{ issues: KnownIssue[] }> = ({ issues }) => (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
            <WarningIcon />
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Известные ограничения</p>
        </div>
        <div className="space-y-2.5">
            {issues.map((issue, idx) => (
                <div key={idx} className="text-sm">
                    <p className="text-amber-900 font-medium">{issue.description}</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                        <span className="font-medium">Почему: </span>{issue.reason}
                    </p>
                    {issue.workaround && (
                        <p className="text-amber-700 text-xs mt-0.5">
                            <span className="font-medium">Что делать: </span>{issue.workaround}
                        </p>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// =====================================================================
// Компонент одной записи обновления (аккордеон)
// =====================================================================
const UpdateEntryCard: React.FC<{ entry: UpdateEntry }> = ({ entry }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTechnicalOpen, setIsTechnicalOpen] = useState(false);

    return (
        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden border-l-4 ${getTypeBorderColor(entry.type)} transition-shadow hover:shadow-sm`}>
            {/* Заголовок карточки — всегда видимый, кликабельный */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 focus:outline-none"
            >
                {/* Шеврон аккордеона */}
                <ChevronIcon isOpen={isOpen} className="text-gray-400 flex-shrink-0" />

                {/* Иконка типа */}
                {getTypeIcon(entry.type)}

                {/* Заголовок и бейджи */}
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">{entry.title}</h3>
                    {/* Бейдж типа влияния */}
                    {entry.impactType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getImpactBadgeStyle(entry.impactType)}`}>
                            {getImpactIcon(entry.impactType)} {getImpactLabel(entry.impactType)}
                        </span>
                    )}
                </div>

                {/* Индикатор наличия known issues */}
                {entry.knownIssues && entry.knownIssues.length > 0 && (
                    <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium" title="Есть известные ограничения">
                        ⚠ {entry.knownIssues.length}
                    </span>
                )}
            </button>

            {/* Раскрывающееся содержимое */}
            {isOpen && (
                <div className="px-4 pb-4 pt-1 ml-[52px] space-y-4">
                    {/* Секция: Описание проблемы / Что добавили */}
                    <div className="bg-gray-50 rounded-md p-3 border-l-2 border-gray-300">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            {entry.type === 'feature' ? 'Что добавили' : 'Проблема'}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.userDescription}</p>
                    </div>

                    {/* Секция: Реализация / Решение */}
                    <div className="bg-gray-50 rounded-md p-3 border-l-2 border-indigo-300">
                        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1.5">
                            {entry.type === 'feature' ? 'Реализация' : 'Решение'}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.userSolution}</p>
                    </div>

                    {/* Секция: Как использовать */}
                    {entry.userInstructions && entry.userInstructions.length > 0 && (
                        <div className="bg-gray-50 rounded-md p-3 border-l-2 border-green-300">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">Как использовать</p>
                            <ol className="list-decimal list-inside space-y-1">
                                {entry.userInstructions.map((step, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Секция: Что теперь можно */}
                    {entry.userBenefits && (
                        <div className="bg-gray-50 rounded-md p-3 border-l-2 border-emerald-300">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">Что теперь можно</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{entry.userBenefits}</p>
                        </div>
                    )}

                    {/* Секция: Известные ограничения */}
                    {entry.knownIssues && entry.knownIssues.length > 0 && (
                        <KnownIssuesBlock issues={entry.knownIssues} />
                    )}

                    {/* Техническая составляющая (вложенный аккордеон) */}
                    {entry.technicalDetails && (
                        <div>
                            <button
                                onClick={() => setIsTechnicalOpen(!isTechnicalOpen)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ChevronIcon isOpen={isTechnicalOpen} className="h-3 w-3" />
                                <span>Техническая составляющая</span>
                            </button>
                            {isTechnicalOpen && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <p className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap">{entry.technicalDetails}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// =====================================================================
// Боковая панель со списком релизов
// =====================================================================
const UpdatesSidebar: React.FC<{
    releases: ReleaseUpdate[];
    selectedIndex: number | null;
    onSelectIndex: (index: number) => void;
}> = ({ releases, selectedIndex, onSelectIndex }) => {
    return (
        <div className="space-y-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Обновления</p>
            {releases.map((release, index) => {
                const isSelected = selectedIndex === index;
                const bugfixCount = release.entries.filter(e => e.type === 'bugfix').length;
                const featureCount = release.entries.filter(e => e.type === 'feature').length;
                const improvementCount = release.entries.filter(e => e.type === 'improvement').length;

                return (
                    <button
                        key={`${release.date}-${index}`}
                        onClick={() => onSelectIndex(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isSelected
                                ? 'bg-indigo-50 border-l-2 border-indigo-600'
                                : 'hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                                {release.date}
                            </span>
                            {release.status === 'in-progress' && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">В работе</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{release.summary}</p>
                        {/* Мини-статистика */}
                        <div className="flex gap-2 mt-2">
                            {featureCount > 0 && (
                                <span className="text-xs text-green-600">+{featureCount} новых</span>
                            )}
                            {improvementCount > 0 && (
                                <span className="text-xs text-blue-600">{improvementCount} улучш.</span>
                            )}
                            {bugfixCount > 0 && (
                                <span className="text-xs text-red-500">{bugfixCount} исправл.</span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

// =====================================================================
// Контент выбранного релиза
// =====================================================================
const UpdateContent: React.FC<{ release: ReleaseUpdate }> = ({ release }) => {
    const features = release.entries.filter(e => e.type === 'feature');
    const improvements = release.entries.filter(e => e.type === 'improvement');
    const bugfixes = release.entries.filter(e => e.type === 'bugfix');

    return (
        <div className="max-w-4xl">
            {/* Заголовок */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Обновление от {release.date}</h2>
                <p className="text-sm text-gray-500 mt-1">{release.summary}</p>
                {/* Общая статистика */}
                <div className="flex gap-4 mt-3">
                    {features.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-sm text-gray-600">Новые возможности - {features.length}</span>
                        </div>
                    )}
                    {improvements.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-sm text-gray-600">Улучшения - {improvements.length}</span>
                        </div>
                    )}
                    {bugfixes.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-sm text-gray-600">Исправления - {bugfixes.length}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Новые возможности */}
            {features.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                        Новые возможности
                    </h3>
                    <div className="space-y-5">
                        {groupBySection(features).map(group => (
                            <div key={group.section}>
                                {/* Подзаголовок раздела */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-400">📂</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.section}</span>
                                    <span className="flex-1 border-b border-gray-100"></span>
                                    <span className="text-xs text-gray-400">{group.entries.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {group.entries.map(entry => (
                                        <UpdateEntryCard key={entry.id} entry={entry} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Улучшения */}
            {improvements.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                        Улучшения
                    </h3>
                    <div className="space-y-5">
                        {groupBySection(improvements).map(group => (
                            <div key={group.section}>
                                {/* Подзаголовок раздела */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-400">📂</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.section}</span>
                                    <span className="flex-1 border-b border-gray-100"></span>
                                    <span className="text-xs text-gray-400">{group.entries.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {group.entries.map(entry => (
                                        <UpdateEntryCard key={entry.id} entry={entry} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Исправления */}
            {bugfixes.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-red-500 rounded-full"></span>
                        Исправления
                    </h3>
                    <div className="space-y-5">
                        {groupBySection(bugfixes).map(group => (
                            <div key={group.section}>
                                {/* Подзаголовок раздела */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-400">📂</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.section}</span>
                                    <span className="flex-1 border-b border-gray-100"></span>
                                    <span className="text-xs text-gray-400">{group.entries.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {group.entries.map(entry => (
                                        <UpdateEntryCard key={entry.id} entry={entry} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// =====================================================================
// Экран приветствия (если ничего не выбрано)
// =====================================================================
const UpdatesWelcome: React.FC = () => (
    <div className="flex items-center justify-center h-full text-center">
        <div>
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-500">Выберите обновление</h3>
            <p className="text-sm text-gray-400 mt-1">Нажмите на дату в списке слева, чтобы увидеть подробности</p>
        </div>
    </div>
);

// =====================================================================
// Главная страница обновлений
// =====================================================================
export const UpdatesPage: React.FC = () => {
    // По умолчанию выбираем последнее обновление (по индексу, чтобы не ломалось при одинаковых датах)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(
        updatesData.length > 0 ? 0 : null
    );

    const selectedRelease = selectedIndex !== null ? updatesData[selectedIndex] ?? null : null;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Заголовок */}
            <header className="flex-shrink-0 border-b border-gray-200">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold text-gray-800">Обновления</h1>
                    <p className="text-sm text-gray-500">История изменений и новых возможностей приложения</p>
                </div>
            </header>

            {/* Основное содержимое */}
            <main className="flex-grow flex overflow-hidden">
                {/* Боковая панель с датами */}
                <aside className="w-64 border-r border-gray-200 p-3 overflow-y-auto custom-scrollbar flex-shrink-0">
                    <UpdatesSidebar
                        releases={updatesData}
                        selectedIndex={selectedIndex}
                        onSelectIndex={setSelectedIndex}
                    />
                </aside>

                {/* Контент */}
                <section className="flex-1 px-8 py-6 overflow-y-auto custom-scrollbar">
                    {selectedRelease ? (
                        <UpdateContent release={selectedRelease} />
                    ) : (
                        <UpdatesWelcome />
                    )}
                </section>
            </main>
        </div>
    );
};
