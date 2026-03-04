import React from 'react';
import { Sandbox } from '../shared';
import { MockFilterPanel } from './ListsFilters_MockPanel';
import { MockMembersTable } from './ListsFilters_MockTable';

// =====================================================================
// Секция «Что это такое?» — описание панели фильтров + песочница
// =====================================================================
export const FiltersOverviewSection: React.FC = () => {
    return (
        <>
            {/* Что это такое? */}
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что это такое?</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Панель фильтров — это закреплённая область над таблицей данных, которая включает:
            </p>

            <div className="not-prose my-6 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <div>
                        <div className="font-bold text-gray-900">Поле поиска</div>
                        <div className="text-sm text-gray-700">Поиск по имени пользователя или ID</div>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <div>
                        <div className="font-bold text-gray-900">Выпадающие фильтры</div>
                        <div className="text-sm text-gray-700">8 категорий фильтров (статус, пол, возраст, онлайн, платформа и др.)</div>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                        <div className="font-bold text-gray-900">Счётчик результатов</div>
                        <div className="text-sm text-gray-700">"Найдено: X" — количество записей, соответствующих условиям</div>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                        <div className="font-bold text-gray-900">Кнопка "Сбросить"</div>
                        <div className="text-sm text-gray-700">Появляется при активных фильтрах, возвращает всё к начальному состоянию</div>
                    </div>
                </div>
            </div>

            {/* Интерактивная песочница */}
            <Sandbox
                title="🎮 Интерактивная демонстрация"
                description="Попробуйте использовать фильтры — все изменения применяются мгновенно."
                instructions={[
                    '<strong>Введите текст</strong> в поле поиска — счётчик "Найдено" изменится',
                    '<strong>Откройте выпадающий список</strong> — кликните на любой фильтр',
                    '<strong>Выберите опцию</strong> — фильтр выделится цветом (индиго фон)',
                    '<strong>Сбросьте фильтры</strong> — кнопка "Сбросить" появится справа при активных условиях'
                ]}
            >
                <div className="space-y-4">
                    <MockFilterPanel />
                    <MockMembersTable />
                </div>
            </Sandbox>
        </>
    );
};
