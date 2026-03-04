import React, { useState } from 'react';
import { Sandbox } from '../../shared';
import { MOCK_PROJECTS, filterProjects, ActiveTab, TeamFilter, PostFilter } from './_data';
import { SandboxMainPanel } from './SandboxMainPanel';
import { SandboxProjectsList } from './SandboxProjectsList';
import { SandboxWorkArea } from './SandboxWorkArea';

// =====================================================================
// Sandbox-обёртка модуля «Контент-менеджмент» — трёхколоночный макет
// Содержит стейт и объединяет 3 колонки: панель / проекты / рабочая область
// =====================================================================
export const SandboxModuleLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
    const [automationsOpen, setAutomationsOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>('project-1');
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
    const [postFilter, setPostFilter] = useState<PostFilter>('all');

    // Фильтрация проектов
    const filteredProjects = filterProjects(MOCK_PROJECTS, searchQuery, teamFilter, postFilter);

    return (
        <Sandbox
            title="Структура модуля: 3 колонки"
            description="Визуальное представление расположения элементов в модуле Контент-менеджмент. Нажмите на вкладки в выдвижном меню главной панели, чтобы увидеть как меняется содержимое рабочей области."
            instructions={[
                'Нажмите на <strong>"Отложенные"</strong>, <strong>"Предложенные"</strong> или <strong>"Товары"</strong> в выдвижном меню — содержимое рабочей области изменится',
                'Нажмите на <strong>"Автоматизации"</strong> — раскроется список из 7 подразделов'
            ]}
        >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-4 font-semibold">Структура модуля (3 колонки):</p>
            
            <div className="flex gap-2" style={{ height: '500px' }}>
                {/* Колонка 1: Главная панель с выдвижным меню */}
                <SandboxMainPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    automationsOpen={automationsOpen}
                    setAutomationsOpen={setAutomationsOpen}
                />

                {/* Колонка 2: Список проектов */}
                <SandboxProjectsList
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    teamFilter={teamFilter}
                    setTeamFilter={setTeamFilter}
                    postFilter={postFilter}
                    setPostFilter={setPostFilter}
                    filteredProjects={filteredProjects}
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                />

                {/* Колонка 3: Рабочая область */}
                <SandboxWorkArea activeTab={activeTab} />
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
        </Sandbox>
    );
};
