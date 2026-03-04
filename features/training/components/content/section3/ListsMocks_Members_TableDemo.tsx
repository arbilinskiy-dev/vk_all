import React, { useState } from 'react';
import { mockMembers } from './ListsMocks_Members_Data';
import { MemberRow } from './ListsMocks_Members_Row';

// =====================================================================
// MOCK КОМПОНЕНТ: ТАБЛИЦА УЧАСТНИКОВ С ДАННЫМИ (раздел 3.2.3)
// =====================================================================

export const MembersTableDemo: React.FC = () => {
    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm relative">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">
                            
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Пользователь (ID / ФИО)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Пол
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            ДР
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Город
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Онлайн / Платформа
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Статус
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Дата события
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            Источник
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {mockMembers.map(member => (
                        <MemberRow key={member.id} member={member} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// =====================================================================
// MOCK КОМПОНЕНТ: СОСТОЯНИЯ ТАБЛИЦЫ (загрузка / пусто / данные)
// =====================================================================

export const TableStatesDemo: React.FC = () => {
    const [state, setState] = useState<'loading' | 'empty' | 'data'>('loading');

    return (
        <div className="space-y-4">
            {/* Панель переключения */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setState('loading')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        state === 'loading'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Загрузка
                </button>
                <button
                    onClick={() => setState('empty')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        state === 'empty'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Пустой список
                </button>
                <button
                    onClick={() => setState('data')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        state === 'data'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    С данными
                </button>
            </div>

            {/* Отображение состояния */}
            <div className="bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
                {state === 'loading' && (
                    <div className="p-8 text-center text-gray-500">
                        <div className="inline-block h-8 w-8 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p>Загрузка участников...</p>
                    </div>
                )}

                {state === 'empty' && (
                    <div className="p-12 text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="font-medium">Список пуст</p>
                        <p className="text-sm mt-1">Участники появятся после синхронизации</p>
                    </div>
                )}

                {state === 'data' && (
                    <div className="w-full p-4">
                        <MembersTableDemo />
                    </div>
                )}
            </div>
        </div>
    );
};
