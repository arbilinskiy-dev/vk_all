import React from 'react';

// =====================================================================
// Блок «Что ты сможешь делать» — карточки типичных задач
// =====================================================================
export const SidebarNavOverview_Tasks: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что ты сможешь делать?</h2>

        <div className="not-prose space-y-3 my-6">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-green-900">Переключаться между проектами</p>
                    <p className="text-sm text-gray-700 mt-1">Кликнуть на проект и сразу увидеть его расписание.</p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-blue-900">Видеть состояние всех проектов</p>
                    <p className="text-sm text-gray-700 mt-1">По счётчикам и индикаторам видишь, что происходит в каждом сообществе.</p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-purple-900">Быстро находить нужный проект</p>
                    <p className="text-sm text-gray-700 mt-1">Использовать поиск и фильтры вместо прокрутки по списку.</p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-orange-900">Обновлять данные и настраивать проекты</p>
                    <p className="text-sm text-gray-700 mt-1">Кнопки для обновления и доступа к настройкам находятся прямо здесь.</p>
                </div>
            </div>
        </div>
    </>
);
