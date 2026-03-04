import React from 'react';
import { MockPrimarySidebarFull } from './PrimarySidebarIntro_MockComponents';
import { Sandbox } from './PrimarySidebarIntro_Sandbox';

// =====================================================================
// Секция интерактивной демонстрации главной панели
// =====================================================================

/** Пропсы секции — получает состояние из хаба */
interface InteractiveDemoProps {
    activeIcon: string;
    onIconClick: (icon: string) => void;
    getModuleName: (icon: string) => string;
}

/** Интерактивная песочница: кликабельная mock-панель + подсказки */
export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ activeIcon, onIconClick, getModuleName }) => (
    <Sandbox
        title="Попробуйте сами: Взаимодействие с главной панелью"
        description="Кликайте на иконки, чтобы увидеть, как меняется интерфейс."
        instructions={[
            '<strong>Кликните</strong> на иконки в верхней части — откроются разные модули.',
            'При выборе модуля <strong>появляется вторая колонка</strong> с вкладками.',
            'Активная иконка подсвечивается <strong>синим цветом</strong> и увеличивается.'
        ]}
        rightPanel={
            <div className="bg-white rounded-lg border border-indigo-200 p-4 h-full flex flex-col">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Попробуйте:</p>
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                    <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span><strong>Кликните</strong> на иконки в верхней части — откроются разные модули.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>При выборе модуля <strong>появляется вторая колонка</strong> с вкладками.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Активная иконка подсвечивается <strong>синим</strong> и увеличивается.</span>
                    </li>
                </ul>
                <div className="mt-auto pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                        <strong>Активный модуль:</strong>{' '}
                        <span className="text-indigo-600 font-bold">{getModuleName(activeIcon)}</span>
                    </p>
                    {(activeIcon === 'km' || activeIcon === 'lists') && (
                        <p className="text-xs text-gray-500 mt-1">
                            Вторая колонка появляется только для модулей с подразделами.
                        </p>
                    )}
                </div>
            </div>
        }
    >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <MockPrimarySidebarFull activeIcon={activeIcon} onIconClick={onIconClick} />
        </div>
    </Sandbox>
);
