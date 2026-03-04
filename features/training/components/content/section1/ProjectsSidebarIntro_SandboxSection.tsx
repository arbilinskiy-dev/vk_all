import React from 'react';
import { Sandbox } from '../shared';
import { MockProject, MockProjectsSidebar } from './ProjectsSidebarIntro_MockComponents';

// =====================================================================
// Секция: интерактивная песочница сайдбара проектов
// =====================================================================

interface SandboxSectionProps {
    /** Список мок-проектов */
    mockProjects: MockProject[];
    /** ID выбранного проекта */
    selectedProject: string | null;
    /** Обработчик выбора проекта */
    onSelect: (id: string) => void;
}

/** Интерактивная песочница — полнофункциональный сайдбар */
export const SandboxSection: React.FC<SandboxSectionProps> = ({ 
    mockProjects, 
    selectedProject, 
    onSelect 
}) => (
    <Sandbox
        title="Попробуйте сами: Работа с сайдбаром проектов"
        description="Полнофункциональный сайдбар с поиском, фильтрами и выбором проектов."
        instructions={[
            '<strong>Кликните</strong> на проект, чтобы выбрать его (подсветится синим).',
            '<strong>Введите</strong> текст в поиск, чтобы отфильтровать список.',
            '<strong>Раскройте</strong> меню фильтров и выберите "Требуют внимания" — покажутся только проекты с 0 постов.',
            'Обратите внимание на <strong>цветовые счётчики</strong> (зелёный/жёлтый/красный).'
        ]}
    >
        <div className="bg-gray-100 rounded-lg p-6 flex justify-center">
            <div className="h-[600px] overflow-hidden rounded-lg border-2 border-gray-300 shadow-xl">
                <MockProjectsSidebar 
                    projects={mockProjects}
                    selectedId={selectedProject}
                    onSelect={onSelect}
                />
            </div>
        </div>
        {selectedProject && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-gray-700">
                    <strong>Выбран проект:</strong>{' '}
                    <span className="text-green-600 font-bold">
                        {mockProjects.find(p => p.id === selectedProject)?.name}
                    </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    В реальном приложении рабочая область справа загрузит данные этого проекта.
                </p>
            </div>
        )}
    </Sandbox>
);
