/**
 * PromoListsView — главный экран: поиск, список карточек, переменные, модалка удаления.
 */

import React from 'react';
import { PromoList, PromoVariableInfo } from '../../../../services/api/promo_lists.api';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';

interface PromoListsViewProps {
    /** Данные */
    filteredLists: PromoList[];
    variables: PromoVariableInfo[];
    searchQuery: string;
    /** Модалка */
    confirmDeleteList: string | null;
    isDeleting: boolean;
    /** Действия */
    onSearchChange: (value: string) => void;
    onCreateList: () => void;
    onOpenCodes: (list: PromoList) => void;
    onEditList: (list: PromoList) => void;
    onDeleteList: (listId: string) => void;
    onSetConfirmDeleteList: (id: string | null) => void;
}

export const PromoListsView: React.FC<PromoListsViewProps> = ({
    filteredLists,
    variables,
    searchQuery,
    confirmDeleteList,
    isDeleting,
    onSearchChange,
    onCreateList,
    onOpenCodes,
    onEditList,
    onDeleteList,
    onSetConfirmDeleteList,
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Шапка + поиск + кнопка создания */}
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Поиск списков..."
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                    <button
                        onClick={onCreateList}
                        className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        title="Создать список промокодов"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Список */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredLists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-sm text-gray-400 text-center">
                            {searchQuery ? 'Ничего не найдено' : 'Списков промокодов пока нет'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onCreateList}
                                className="mt-3 px-4 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            >
                                Создать первый список
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredLists.map(list => (
                            <div
                                key={list.id}
                                className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => onOpenCodes(list)}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{list.name}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{list.slug}</p>
                                        <div className="flex gap-3 mt-1 text-xs">
                                            <span className="text-green-600">Свободных: {list.free_count}</span>
                                            <span className="text-orange-500">Выданных: {list.issued_count}</span>
                                            <span className="text-gray-400">Всего: {list.total_count}</span>
                                        </div>
                                    </div>

                                    {/* Кнопки: редактировать и удалить */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            onClick={e => { e.stopPropagation(); onEditList(list); }}
                                            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Редактировать"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); onSetConfirmDeleteList(list.id); }}
                                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Удалить список"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Подсказка по переменным */}
            {variables.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Доступные переменные:</p>
                    <div className="flex flex-wrap gap-1">
                        {variables.map(v => (
                            <React.Fragment key={v.slug}>
                                <code className="text-[11px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded" title={`Код из "${v.list_name}" (свободных: ${v.free_count})`}>
                                    {v.code_variable}
                                </code>
                                <code className="text-[11px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded" title={`Описание из "${v.list_name}"`}>
                                    {v.description_variable}
                                </code>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Модалка подтверждения удаления списка */}
            {confirmDeleteList && (
                <ConfirmationModal
                    title="Удалить список?"
                    message="Все промокоды из этого списка будут удалены безвозвратно, включая историю выдачи."
                    onConfirm={() => onDeleteList(confirmDeleteList)}
                    onCancel={() => onSetConfirmDeleteList(null)}
                    confirmText="Удалить"
                    confirmButtonVariant="danger"
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};
