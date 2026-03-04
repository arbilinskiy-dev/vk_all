import React, { useState } from 'react';

// =====================================================================
// Вспомогательные мок-компоненты для страницы «О Центре обучения»
// =====================================================================

// ---------------------------------------------------------------------
// Песочница — обёртка для интерактивных демо-блоков
// ---------------------------------------------------------------------
export const Sandbox: React.FC<{ 
    title: string; 
    description: string; 
    children: React.ReactNode;
    instructions?: string[];
}> = ({ title, description, children, instructions }) => (
    <div className="relative not-prose p-6 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 mt-8">
        <h4 className="text-xl font-bold text-indigo-800 mb-2">{title}</h4>
        <p className="text-sm text-indigo-700 mb-4">{description}</p>
        {instructions && instructions.length > 0 && (
            <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1 mb-6">
                {instructions.map((item, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
            </ul>
        )}
        {children}
    </div>
);

// ---------------------------------------------------------------------
// Главная навигационная панель (мок)
// ---------------------------------------------------------------------
export const MockPrimarySidebar: React.FC = () => {
    const [activeItem, setActiveItem] = useState<string>('calendar');
    
    const menuItems = [
        { id: 'calendar', icon: '📅', label: 'Отложенные', description: 'Календарь с постами' },
        { id: 'suggested', icon: '📥', label: 'Предложенные', description: 'Посты от подписчиков' },
        { id: 'products', icon: '🛍️', label: 'Товары', description: 'Управление товарами' },
        { id: 'automations', icon: '⚙️', label: 'Автоматизации', description: 'Конкурсы и боты' },
        { id: 'lists', icon: '📋', label: 'Списки', description: 'Пользователи и активность' },
        { id: 'projects', icon: '🏢', label: 'Проекты', description: 'База данных проектов' },
        { id: 'settings', icon: '⚡', label: 'Настройки', description: 'Администрирование' },
    ];

    return (
        <div className="bg-gray-900 rounded-lg p-2 w-20">
            <div className="space-y-1">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveItem(item.id)}
                        className={`w-full p-3 rounded-lg text-center transition-all duration-200 group relative ${
                            activeItem === item.id 
                                ? 'bg-indigo-600 text-white' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                        title={item.label}
                    >
                        <span className="text-xl">{item.icon}</span>
                        {/* Тултип */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// Карточка поста (миниатюрная)
// ---------------------------------------------------------------------
export const MockPostCardSmall: React.FC<{ type: 'system' | 'vk' | 'published'; time: string; hasImages?: boolean }> = ({ type, time, hasImages = true }) => {
    const borderStyle = type === 'system' ? 'border-dashed border-2 border-indigo-400' : 
                        type === 'vk' ? 'border-2 border-indigo-500' : 
                        'border border-gray-300 bg-gray-50';
    const label = type === 'system' ? 'Системный' : type === 'vk' ? 'Отложка VK' : 'Опубликован';
    const labelColor = type === 'system' ? 'bg-indigo-100 text-indigo-700' : 
                       type === 'vk' ? 'bg-blue-100 text-blue-700' : 
                       'bg-green-100 text-green-700';

    return (
        <div className={`rounded-lg p-2 ${borderStyle} bg-white`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{time}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${labelColor}`}>{label}</span>
            </div>
            {hasImages && (
                <div className="w-full h-12 bg-gradient-to-br from-indigo-200 to-purple-200 rounded mb-1" />
            )}
            <p className="text-xs text-gray-600 truncate">Пример текста поста...</p>
        </div>
    );
};

// ---------------------------------------------------------------------
// Мини-календарь (мок)
// ---------------------------------------------------------------------
export const MockMiniCalendar: React.FC = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    return (
        <div className="bg-white rounded-lg border p-3">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">Январь 2026</span>
                <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-500">◀</button>
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-500">▶</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {days.map(d => (
                    <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
                {/* Колонки с постами */}
                <div className="col-span-7 grid grid-cols-7 gap-1">
                    {[20, 21, 22, 23, 24, 25, 26].map(day => (
                        <div key={day} className="space-y-1">
                            <div className="text-xs text-gray-600 text-center py-1 font-medium">{day}</div>
                            {day === 21 && <MockPostCardSmall type="vk" time="10:00" />}
                            {day === 22 && <MockPostCardSmall type="system" time="15:00" />}
                            {day === 23 && <MockPostCardSmall type="published" time="12:00" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// Интерактивная демо-песочница (клик + аккордеон)
// ---------------------------------------------------------------------
export const InteractiveSandboxDemo: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    return (
        <div className="space-y-4">
            {/* Демо: Кликабельный элемент */}
            <div 
                onClick={() => setClickCount(c => c + 1)}
                className="bg-white border-2 border-dashed border-indigo-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            >
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">👆 Кликните на меня!</span>
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                        Кликов: {clickCount}
                    </span>
                </div>
            </div>

            {/* Демо: Разворачивающийся текст */}
            <div className="bg-white border rounded-lg p-4">
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">📖 Разворачивающийся текст</span>
                        <span className={`text-indigo-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    <p className={`text-sm text-gray-600 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-40' : 'max-h-5'}`}>
                        Это пример текста, который можно развернуть и свернуть. В реальном приложении такая механика используется для карточек постов — 
                        вы можете быстро просмотреть содержимое, не открывая модальное окно редактирования. Кликните еще раз, чтобы свернуть.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// Оглавление (мок)
// ---------------------------------------------------------------------
export const MockTableOfContents: React.FC = () => {
    const [expandedSections, setExpandedSections] = useState<string[]>(['section-1']);
    const [selectedItem, setSelectedItem] = useState<string>('1-1');

    const toggleSection = (id: string) => {
        setExpandedSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const sections = [
        { 
            id: 'section-0', 
            title: '📚 Раздел 0: О Центре обучения',
            items: [
                { id: '0-1', title: '0.1. Что такое Центр обучения?' },
                { id: '0-2', title: '0.2. Как работать с Центром' },
            ]
        },
        { 
            id: 'section-1', 
            title: '🚀 Раздел 1: Введение',
            items: [
                { id: '1-1', title: '1.1. Что такое Планировщик?' },
                { id: '1-2', title: '1.2. Знакомство с интерфейсом' },
            ]
        },
        { 
            id: 'section-2', 
            title: '📅 Раздел 2: Контент-менеджмент',
            items: [
                { id: '2-1', title: '2.1. Вкладка "Отложенные"' },
                { id: '2-2', title: '2.2. Вкладка "Предложенные"' },
            ]
        },
    ];

    return (
        <div className="bg-white border rounded-lg p-3 w-64">
            <div className="space-y-1">
                {sections.map(section => (
                    <div key={section.id}>
                        <button 
                            onClick={() => toggleSection(section.id)}
                            className="w-full text-left px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
                        >
                            <span>{section.title}</span>
                            <span className={`text-gray-400 transition-transform ${expandedSections.includes(section.id) ? 'rotate-90' : ''}`}>▶</span>
                        </button>
                        {expandedSections.includes(section.id) && (
                            <div className="ml-4 border-l-2 border-gray-200 pl-2 space-y-1">
                                {section.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                                            selectedItem === item.id 
                                                ? 'bg-indigo-100 text-indigo-700 font-medium' 
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {item.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// Карточка товара (мок)
// ---------------------------------------------------------------------
export const MockProductCard: React.FC = () => (
    <div className="bg-white border rounded-lg p-3 w-48">
        <div className="w-full h-24 bg-gradient-to-br from-pink-200 to-orange-200 rounded-lg mb-2 flex items-center justify-center text-3xl">
            🛍️
        </div>
        <h4 className="text-sm font-medium text-gray-800 truncate">Название товара</h4>
        <p className="text-xs text-gray-500 truncate">Категория товара</p>
        <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-indigo-600">1 500 ₽</span>
            <span className="text-xs text-gray-400 line-through">2 000 ₽</span>
        </div>
    </div>
);

// ---------------------------------------------------------------------
// Карточка конкурса (мок)
// ---------------------------------------------------------------------
export const MockContestCard: React.FC = () => (
    <div className="bg-white border rounded-lg p-4 w-64">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-lg flex items-center justify-center text-xl">
                🏆
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-800">Конкурс отзывов</h4>
                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Активен</span>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2">
                <div className="text-lg font-bold text-gray-800">24</div>
                <div className="text-xs text-gray-500">Участников</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
                <div className="text-lg font-bold text-gray-800">5</div>
                <div className="text-xs text-gray-500">Победителей</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
                <div className="text-lg font-bold text-gray-800">12</div>
                <div className="text-xs text-gray-500">Промокодов</div>
            </div>
        </div>
    </div>
);
