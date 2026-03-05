import React, { useState, useEffect, useCallback } from 'react';
import { AppView, AppModule } from '../../../App';
import { useAuth } from '../../auth/contexts/AuthContext';

// Ключ для сохранения состояния сайдбара в localStorage
const SIDEBAR_COLLAPSED_KEY = 'primarySidebarCollapsed';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    isActive?: boolean;
    children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ label, isActive, children, ...props }) => (
    <button
        title={label}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-indigo-500 ${
            isActive 
            ? 'bg-indigo-50 text-indigo-600' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
        }`}
        {...props}
    >
        {children}
    </button>
);

interface PrimarySidebarProps {
    userRole: 'admin' | 'user';
    isSystemAdmin?: boolean;
    activeModule: AppModule | null;
    activeView: AppView;
    onSelectModule: (module: AppModule) => void;
    onSelectView: (view: AppView) => void;
    onSelectListsView: (view: AppView) => void;
    onSelectMessagesView: (view: AppView) => void;
    onSelectStatsView: (view: AppView) => void;
    onSelectGlobalView: (view: AppView) => void;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
    userRole,
    isSystemAdmin,
    activeModule,
    activeView,
    onSelectModule,
    onSelectView,
    onSelectListsView,
    onSelectMessagesView,
    onSelectStatsView,
    onSelectGlobalView,
}) => {
    const { logout } = useAuth();
    const isKmActive = activeModule === 'km';
    const isListsActive = activeModule === 'lists';
    const isMessagesActive = activeModule === 'am';
    const isStatsActive = activeModule === 'stats';
    
    // Состояние сворачивания сайдбара (восстанавливается из localStorage)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
        } catch {
            return false;
        }
    });

    // Переключение сворачивания с сохранением в localStorage
    const toggleCollapsed = useCallback(() => {
        setIsCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {}
            return next;
        });
    }, []);

    const isAutomationsGroupActive = activeView.startsWith('automations');
    // ИЗМЕНЕНИЕ: Секция развернута по умолчанию (true), даже если активна другая вкладка
    const [isAutomationsOpen, setIsAutomationsOpen] = useState(true);

    useEffect(() => {
        // Автоматически открываем аккордеон, если выбрана одна из его вкладок (на всякий случай)
        if (activeView.startsWith('automations')) {
            setIsAutomationsOpen(true);
        }
    }, [activeView]);

    const handleAutomationsClick = () => {
        // Если выбрана дочерняя вкладка, клик на родителя переводит на основную вкладку автоматизаций
        if (activeView.startsWith('automations-')) {
            onSelectView('automations');
        } 
        // Если мы не в разделе автоматизаций, переходим туда
        else if (activeView !== 'automations') {
            onSelectView('automations');
        } 
        // Если мы уже на основной вкладке автоматизаций, просто сворачиваем/разворачиваем
        else {
            setIsAutomationsOpen(prev => !prev);
        }
    };


    return (
        // Главный контейнер
        <div className="flex-shrink-0 bg-white border-r border-gray-200 flex z-30 shadow-sm">

            {/* Колонка 1: Основные иконки. Фиксированная ширина, чтобы иконки не "прыгали". */}
            <div className="w-16 flex-shrink-0 flex flex-col items-center justify-between py-4">
                {/* Верхняя группа: Модули */}
                <div className="space-y-4">
                    {/* Кнопка «Развернуть меню» — видна только когда сайдбар свёрнут и есть активный модуль */}
                    {isCollapsed && (isKmActive || isListsActive || isMessagesActive || isStatsActive) && (
                        <button
                            onClick={toggleCollapsed}
                            title="Развернуть меню"
                            className="w-12 h-8 flex items-center justify-center rounded-lg text-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border border-indigo-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    <IconButton label="Контент-менеджмент" isActive={isKmActive} onClick={() => onSelectModule('km')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </IconButton>
                    <IconButton label="Списки" isActive={isListsActive} onClick={() => onSelectModule('lists')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </IconButton>
                    <IconButton label="Работа с сообщениями" isActive={isMessagesActive} onClick={() => onSelectModule('am')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </IconButton>
                    <IconButton label="Статистика" isActive={activeModule === 'stats'} onClick={() => onSelectModule('stats')}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </IconButton>
                </div>

                {/* Нижняя группа: Глобальные действия */}
                <div className="space-y-4">
                     <IconButton label="VK Auth Integration Test" isActive={activeView === 'vk-auth-test'} onClick={() => onSelectGlobalView('vk-auth-test')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                     </IconButton>

                     <IconButton label="Песочница" isActive={activeView === 'sandbox'} onClick={() => onSelectGlobalView('sandbox')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.456 1.456a2.25 2.25 0 01-1.591.659H8.047a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v9.5" />
                        </svg>
                     </IconButton>

                     <IconButton label="Управление базой проектов" isActive={activeView === 'db-management'} onClick={() => onSelectGlobalView('db-management')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0m16 0s0 0 0 0M12 11a4 4 0 100-8 4 4 0 000 8zm0 0v10m0-10L8 7m4 4l4-4" /></svg>
                     </IconButton>

                     {userRole === 'admin' && (
                        <IconButton label="Управление пользователями" isActive={activeView === 'user-management'} onClick={() => onSelectGlobalView('user-management')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </IconButton>
                     )}

                     <IconButton label="Центр обучения" isActive={activeView === 'training'} onClick={() => onSelectGlobalView('training')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                     </IconButton>

                     <IconButton label="Обновления" isActive={activeView === 'updates'} onClick={() => onSelectGlobalView('updates')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                     </IconButton>

                    <IconButton label="Настройки" isActive={activeView === 'settings'} onClick={() => onSelectGlobalView('settings')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </IconButton>

                     <IconButton label="Выйти" onClick={logout}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     </IconButton>
                </div>
            </div>

            {/* Колонка 2: Под-меню. Скрывается при isCollapsed. */}
            <div className={`flex-shrink-0 border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed 
                    ? 'max-w-0' 
                    : (isKmActive || isListsActive || isMessagesActive || isStatsActive) ? 'max-w-xs' : 'max-w-0'
            }`}>
                {/* Внутренний контейнер с заголовком и кнопкой сворачивания */}
                 <div className="py-4 px-2 flex flex-col h-full w-40">

                    {/* Кнопка сворачивания — в верхней части подменю, всегда видна */}
                    {(isKmActive || isListsActive || isMessagesActive || isStatsActive) && (
                        <button
                            onClick={toggleCollapsed}
                            title="Свернуть меню"
                            className="mb-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200 border border-transparent hover:border-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                            <span>Свернуть</span>
                        </button>
                    )}
                    
                    {/* Под-меню для Контент-менеджмента */}
                    {isKmActive && (
                        <>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 whitespace-nowrap">Контент</p>
                            <div className="space-y-2 w-full">
                                <button onClick={() => onSelectView('schedule')} title="Отложенные" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'schedule' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    Отложенные
                                </button>
                                <button onClick={() => onSelectView('suggested')} title="Предложенные" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'suggested' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    Предложенные
                                </button>
                                <button onClick={() => onSelectView('products')} title="Товары" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'products' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    Товары
                                </button>
                                
                                {/* Аккордеон "Автоматизации" */}
                                <div>
                                    <button 
                                        onClick={handleAutomationsClick} 
                                        title="Автоматизации" 
                                        className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex justify-between items-center ${
                                            isAutomationsGroupActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span>Автоматизации</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isAutomationsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isAutomationsOpen ? 'max-h-72' : 'max-h-0'}`}>
                                        <div className="pl-4 pt-1 space-y-1">
                                            <button onClick={() => onSelectView('automations-stories')} title="Посты в истории" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-stories' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                Посты в истории
                                            </button>
                                            <button onClick={() => onSelectView('automations-reviews-contest')} title="Конкурс отзывов" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-reviews-contest' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                Конкурс отзывов
                                            </button>
                                            <button onClick={() => onSelectView('automations-promo-drop')} title="Дроп промокодов" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-promo-drop' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                Дроп промокодов
                                            </button>
                                             {/* Новые пункты */}
                                            <button onClick={() => onSelectView('automations-contests')} title="Конкурсы" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-contests' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                Конкурсы
                                            </button>
                                            <button onClick={() => onSelectView('automations-contest-v2')} title="Конкурс 2.0" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-contest-v2' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                🚀 Конкурс 2.0
                                            </button>
                                            <button onClick={() => onSelectView('automations-ai-posts')} title="AI посты" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-ai-posts' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                AI посты
                                            </button>
                                            <button onClick={() => onSelectView('automations-birthday')} title="С др" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-birthday' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                С др
                                            </button>
                                            <button onClick={() => onSelectView('automations-activity-contest')} title="Конкурс Актив" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'automations-activity-contest' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                Конкурс Актив
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Под-меню для Списков */}
                    {isListsActive && (
                        <>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 whitespace-nowrap">Списки</p>
                            <div className="space-y-2 w-full">
                                <button onClick={() => onSelectListsView('lists-system')} title="Системные" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'lists-system' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    Системные
                                </button>
                                <button onClick={() => onSelectListsView('lists-user')} title="Пользовательские" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'lists-user' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    Пользовательские
                                </button>
                                <button onClick={() => onSelectListsView('lists-automations')} title="Автоматизации" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap ${activeView === 'lists-automations' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    Автоматизации
                                </button>
                            </div>
                        </>
                    )}

                    {/* Под-меню для Сообщений */}
                    {isMessagesActive && (
                        <>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 whitespace-nowrap">Сообщения</p>
                            <div className="space-y-2 w-full">
                                <button onClick={() => onSelectMessagesView('messages-vk')} title="ВКонтакте" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'messages-vk' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21.547 7h-3.29a.743.743 0 0 0-.655.392s-1.312 2.416-1.734 3.23C14.734 12.813 14 12.126 14 11.11V7.603A1.104 1.104 0 0 0 12.896 6.5h-2.474a1.982 1.982 0 0 0-1.75.813s1.255-.204 1.255 1.49c0 .42.022 1.626.04 2.64a.73.73 0 0 1-1.272.503 21.54 21.54 0 0 1-2.498-4.543.693.693 0 0 0-.63-.403h-2.99a.508.508 0 0 0-.48.685C3.005 10.175 6.918 18 11.38 18h1.878a.742.742 0 0 0 .742-.742v-1.135a.73.73 0 0 1 1.23-.53l2.247 2.112a1.09 1.09 0 0 0 .746.295h2.953c1.424 0 1.424-.988.647-1.753-.546-.538-2.518-2.617-2.518-2.617a1.02 1.02 0 0 1-.078-1.323c.637-.84 1.68-2.212 2.122-2.8.603-.804 1.697-2.507.197-2.507z"/>
                                    </svg>
                                    ВКонтакте
                                </button>
                                <button onClick={() => onSelectMessagesView('messages-tg')} title="Telegram" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'messages-tg' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
                                    </svg>
                                    Telegram
                                </button>
                                <div className="border-t border-gray-200 my-2" />
                                <button onClick={() => onSelectMessagesView('messages-stats')} title="Мониторинг" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'messages-stats' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Мониторинг
                                </button>
                                {isSystemAdmin && (
                                    <button onClick={() => onSelectMessagesView('messages-am-analysis')} title="АМ Анализ" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'messages-am-analysis' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        АМ Анализ
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Под-меню для Статистики */}
                    {isStatsActive && (
                        <>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 whitespace-nowrap">Статистика</p>
                            <div className="space-y-2 w-full">
                                {/* DB Agency */}
                                <button onClick={() => onSelectStatsView('stats-db-agency')} title="DB Agency" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-db-agency' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    DB Agency
                                </button>
                                {/* DB Project */}
                                <button onClick={() => onSelectStatsView('stats-db-project')} title="DB Project" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-db-project' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 12c0 2.21 3.582 4 8 4s8-1.79 8-4" />
                                    </svg>
                                    DB Project
                                </button>
                                {/* DLVRY */}
                                <button onClick={() => onSelectStatsView('stats-dlvry')} title="DLVRY" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-dlvry' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    DLVRY
                                </button>
                                {/* CRM */}
                                <button onClick={() => onSelectStatsView('stats-crm')} title="CRM" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-crm' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    CRM
                                </button>
                                {/* VK Ads */}
                                <button onClick={() => onSelectStatsView('stats-vk-ads')} title="VK Реклама" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-vk-ads' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                    </svg>
                                    VK Ads
                                </button>
                                {/* VK Mass */}
                                <button onClick={() => onSelectStatsView('stats-vk-mass')} title="VK Mass" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-vk-mass' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    VK Mass
                                </button>
                                {/* VK Group */}
                                <button onClick={() => onSelectStatsView('stats-vk-group')} title="VK Сообщество" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-vk-group' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    VK Group
                                </button>
                                {/* VK Content */}
                                <button onClick={() => onSelectStatsView('stats-vk-content')} title="VK Content" className={`w-full text-left p-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeView === 'stats-vk-content' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    VK Content
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};