import React from 'react';

// =====================================================================
// Mock-компоненты для демонстрации главной панели
// =====================================================================

/** Пропсы кнопки-иконки */
interface IconButtonProps {
    label: string;
    isActive?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}

/** Кнопка-иконка с подсветкой активного состояния */
export const MockIconButton: React.FC<IconButtonProps> = ({ label, isActive = false, children, onClick }) => (
    <button
        title={label}
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
            isActive 
            ? 'bg-indigo-50 text-indigo-600 shadow-sm scale-105' 
            : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600 hover:scale-105'
        }`}
    >
        {children}
    </button>
);

/** Полная mock-версия главной панели с иконками и второй колонкой */
export const MockPrimarySidebarFull: React.FC<{ activeIcon: string; onIconClick: (icon: string) => void }> = ({ activeIcon, onIconClick }) => {
    return (
        <div className="bg-white border-r border-gray-200 shadow-sm flex">
            {/* Колонка с иконками */}
            <div className="w-16 flex flex-col items-center justify-between py-4 bg-gray-50">
                {/* Верхняя группа: Модули */}
                <div className="space-y-4">
                    <MockIconButton label="Контент-менеджмент" isActive={activeIcon === 'km'} onClick={() => onIconClick('km')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </MockIconButton>
                    <MockIconButton label="Списки" isActive={activeIcon === 'lists'} onClick={() => onIconClick('lists')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </MockIconButton>
                    <MockIconButton label="Работа с сообщениями (в разработке)" isActive={activeIcon === 'am'} onClick={() => onIconClick('am')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </MockIconButton>
                    <MockIconButton label="Статистика (в разработке)" isActive={activeIcon === 'stats'} onClick={() => onIconClick('stats')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </MockIconButton>
                </div>

                {/* Нижняя группа: Глобальные действия */}
                <div className="space-y-4">
                    <MockIconButton label="База проектов" isActive={activeIcon === 'database'} onClick={() => onIconClick('database')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0m16 0s0 0 0 0M12 11a4 4 0 100-8 4 4 0 000 8zm0 0v10m0-10L8 7m4 4l4-4" />
                        </svg>
                    </MockIconButton>
                    <MockIconButton label="Центр обучения" isActive={activeIcon === 'training'} onClick={() => onIconClick('training')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                    </MockIconButton>
                    <MockIconButton label="Настройки" isActive={activeIcon === 'settings'} onClick={() => onIconClick('settings')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </MockIconButton>
                    <MockIconButton label="Выйти" isActive={false} onClick={() => onIconClick('logout')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </MockIconButton>
                </div>
            </div>

            {/* Вторая колонка с вкладками (всегда занимает место) */}
            <div className="w-44 bg-white border-r border-gray-200 py-4 px-3">
                {activeIcon === 'km' && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Контент</p>
                        <div className="space-y-1">
                            <button className="w-full text-left p-2 rounded-md text-sm bg-indigo-50 text-indigo-700 font-semibold">
                                Отложенные
                            </button>
                            <button className="w-full text-left p-2 rounded-md text-sm text-gray-500 hover:bg-gray-100">
                                Предложенные
                            </button>
                            <button className="w-full text-left p-2 rounded-md text-sm text-gray-500 hover:bg-gray-100">
                                Товары
                            </button>
                            <div className="mt-2">
                                <button className="w-full text-left p-2 rounded-md text-sm text-gray-700 font-semibold hover:bg-gray-100 flex justify-between items-center">
                                    <span>Автоматизации</span>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="pl-4 pt-1 space-y-0.5">
                                    <button className="w-full text-left p-1.5 rounded text-xs text-gray-500 hover:bg-gray-100">
                                        Посты в истории
                                    </button>
                                    <button className="w-full text-left p-1.5 rounded text-xs text-gray-500 hover:bg-gray-100">
                                        Конкурс отзывов
                                    </button>
                                    <button className="w-full text-left p-1.5 rounded text-xs text-gray-500 hover:bg-gray-100">
                                        Дроп промокодов
                                    </button>
                                    <button className="w-full text-left p-1.5 rounded text-xs text-gray-500 hover:bg-gray-100">
                                        Конкурсы
                                    </button>
                                    <button className="w-full text-left p-1.5 rounded text-xs text-gray-500 hover:bg-gray-100">
                                        AI посты
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeIcon === 'lists' && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Списки</p>
                        <div className="space-y-1">
                            <button className="w-full text-left p-2 rounded-md text-sm bg-indigo-50 text-indigo-700 font-semibold">
                                Системные
                            </button>
                            <button className="w-full text-left p-2 rounded-md text-sm text-gray-500 hover:bg-gray-100">
                                Пользовательские
                            </button>
                            <button className="w-full text-left p-2 rounded-md text-sm text-gray-500 hover:bg-gray-100">
                                Автоматизации
                            </button>
                        </div>
                    </div>
                )}
                {activeIcon !== 'km' && activeIcon !== 'lists' && (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-gray-400 text-center px-2">
                            Нет подразделов
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
