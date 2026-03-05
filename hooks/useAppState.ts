
import { useState } from 'react';
import { AppView, AppModule } from '../App';
import { Project } from '../shared/types';
import { ListGroup } from '../features/lists/types';

export const useAppState = () => {
    const [activeModule, setActiveModule] = useState<AppModule>('km');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<AppView>('schedule');
    const [activeViewParams, setActiveViewParams] = useState<Record<string, any>>({});
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [activeListGroup, setActiveListGroup] = useState<ListGroup>('subscribers');

    const handleSelectModule = (module: AppModule) => {
        setActiveModule(module);
        setActiveViewParams({}); // Сбрасываем параметры при смене модуля
        // Если мы уходим из модулей с проектами, сбрасываем активный проект
        if (module !== 'km' && module !== 'lists' && module !== 'am' && module !== 'stats') {
            setActiveProjectId(null);
        } else {
            // Логика установки вида по умолчанию при переключении модулей
            if (module === 'km') {
                 if (!['schedule', 'suggested', 'products', 'automations'].includes(activeView) && !activeView.startsWith('automations-')) {
                     setActiveView('schedule');
                }
            } else if (module === 'lists') {
                 setActiveView('lists-system');
                 setActiveListGroup('subscribers');
            } else if (module === 'am') {
                // Модуль сообщений: по умолчанию показываем VK
                if (activeView !== 'messages-vk' && activeView !== 'messages-tg' && activeView !== 'messages-stats') {
                    setActiveView('messages-vk');
                }
            } else if (module === 'stats') {
                // Модуль статистики: по умолчанию показываем DLVRY
                if (!activeView.startsWith('stats-')) {
                    setActiveView('stats-dlvry');
                }
            }
        }
    };
    
    const handleSelectGlobalView = (view: AppView) => {
        setActiveView(view);
        setActiveModule(null); // Глобальные виды не являются частью модуля
        setActiveViewParams({});
    };
    
    const handleSelectKmView = (view: AppView) => {
        setActiveView(view);
        setActiveModule('km'); // Убедимся, что модуль КМ активен
        // Не сбрасываем параметры здесь автоматически, так как они могут быть установлены перед вызовом
    };

     const handleSelectListsView = (view: AppView) => {
        setActiveView(view);
        setActiveModule('lists');
        setActiveViewParams({});
        
        // Автоматически переключаем группу списков в зависимости от выбранного вида
        if (view === 'lists-automations') {
            setActiveListGroup('automations');
        } else if (view === 'lists-system') {
            setActiveListGroup('subscribers');
        }
    };

    /** Переключение вида внутри модуля «Сообщения» (am) */
    const handleSelectMessagesView = (view: AppView) => {
        setActiveView(view);
        setActiveModule('am');
        setActiveViewParams({});
    };

    /** Переключение вида внутри модуля «Статистика» (stats) */
    const handleSelectStatsView = (view: AppView) => {
        setActiveView(view);
        setActiveModule('stats');
        setActiveViewParams({});
    };

    return {
        activeModule,
        activeProjectId,
        setActiveProjectId,
        activeView,
        activeViewParams,     // Экспортируем параметры
        setActiveViewParams,  // Экспортируем сеттер
        editingProject,
        setEditingProject,
        activeListGroup,
        setActiveListGroup,
        handleSelectModule,
        handleSelectGlobalView,
        handleSelectKmView,
        handleSelectListsView,
        handleSelectMessagesView,
        handleSelectStatsView
    };
};
