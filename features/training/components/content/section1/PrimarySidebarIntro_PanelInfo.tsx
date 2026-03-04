import React from 'react';
import { NavigationLink, NavigationButtons } from '../shared';

// =====================================================================
// Секция «Особенности работы панели» + «Права доступа» + «Что дальше»
// =====================================================================

/** Особенности работы панели (4 карточки) */
const FeaturesGrid: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Особенности работы панели</h2>

        <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">Всегда видна</h4>
                <p className="text-sm text-gray-700">
                    Панель закреплена слева и не скрывается — вы всегда можете переключиться на другой модуль.
                </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-bold text-green-900 mb-2">Активный модуль подсвечен</h4>
                <p className="text-sm text-gray-700">
                    Иконка активного модуля имеет синий фон и более яркий цвет — легко понять, где вы находитесь.
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-bold text-purple-900 mb-2">Реакция на наведение</h4>
                <p className="text-sm text-gray-700">
                    Наведите курсор на иконку — она подсветится серым. Так вы понимаете, что элемент кликабельный.
                </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-bold text-orange-900 mb-2">Подсказки при наведении</h4>
                <p className="text-sm text-gray-700">
                    Задержите курсор на иконке — появится название модуля. Не нужно запоминать, что значит каждая иконка.
                </p>
            </div>
        </div>
    </>
);

/** Блок «Права доступа» — ограничения по ролям */
const AccessRights: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Права доступа</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Не все иконки видны всем пользователям:
        </p>

        <div className="not-prose my-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                        <p className="font-bold text-yellow-900 mb-1">Только для администраторов</p>
                        <p className="text-sm text-gray-700">
                            Иконка "Управление пользователями" видна только пользователям с ролью <code className="bg-yellow-100 px-1.5 py-0.5 rounded text-xs">admin</code>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </>
);

/** Блок «Что дальше?» — ссылки навигации */
const NextSteps: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что дальше?</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Теперь разберём остальные части интерфейса:
        </p>

        <div className="not-prose my-6 space-y-3">
            <NavigationLink 
                to="1-2-2-projects-sidebar-intro"
                title="1.2.2. Сайдбар проектов"
                description="Вторая колонка со списком всех проектов"
                variant="next"
            />
            <NavigationLink 
                to="1-2-3-workspace-intro"
                title="1.2.3. Рабочая область"
                description="Основная часть экрана, где отображается контент"
                variant="related"
            />
        </div>

        <NavigationButtons currentPath="1-2-1-primary-sidebar-intro" />
    </>
);

/** Составная секция: Особенности + Права доступа + Навигация */
export const PanelInfo: React.FC = () => (
    <>
        <FeaturesGrid />
        <hr className="!my-10" />
        <AccessRights />
        <hr className="!my-10" />
        <NextSteps />
    </>
);
