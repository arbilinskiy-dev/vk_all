/**
 * PromoCodesTable — режим просмотра промокодов внутри списка.
 * Шапка с фильтрами/счётчиками, таблица кодов, кнопки навигации, модалки, переменные.
 */

import React from 'react';
import { PromoList, PromoCode, PromoCodesListResponse } from '../../../../services/api/promo_lists.api';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';

interface PromoCodesTableProps {
    /** Выбранный список */
    selectedList: PromoList;
    selectedListId: string | null;
    /** Промокоды */
    codes: PromoCode[];
    codesResponse: PromoCodesListResponse | null;
    isLoadingCodes: boolean;
    /** Фильтр */
    statusFilter: string | null;
    onStatusFilterChange: (value: string | null) => void;
    /** Модалки */
    confirmDeleteCode: string | null;
    confirmDeleteAllFree: string | null;
    isDeleting: boolean;
    onSetConfirmDeleteCode: (id: string | null) => void;
    onSetConfirmDeleteAllFree: (id: string | null) => void;
    /** Действия */
    onBackToLists: () => void;
    onEditList: (list: PromoList) => void;
    onAddCodesMode: () => void;
    onDeleteCode: (codeId: string) => void;
    onDeleteAllFree: (listId: string) => void;
    /** Навигация */
    vkGroupId?: number | null;
    onNavigateToChat?: (vkUserId: number) => void;
}

export const PromoCodesTable: React.FC<PromoCodesTableProps> = ({
    selectedList,
    selectedListId,
    codes,
    codesResponse,
    isLoadingCodes,
    statusFilter,
    onStatusFilterChange,
    confirmDeleteCode,
    confirmDeleteAllFree,
    isDeleting,
    onSetConfirmDeleteCode,
    onSetConfirmDeleteAllFree,
    onBackToLists,
    onEditList,
    onAddCodesMode,
    onDeleteCode,
    onDeleteAllFree,
    vkGroupId,
    onNavigateToChat,
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Шапка */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <button
                    onClick={onBackToLists}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Назад к спискам"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{selectedList.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">slug: {selectedList.slug}</p>
                </div>
                <button
                    onClick={() => onEditList(selectedList)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Редактировать список"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            </div>

            {/* Счётчики + фильтр */}
            <div className="px-4 py-2 border-b border-gray-100 space-y-2">
                {/* Счётчики */}
                <div className="flex gap-3 text-xs">
                    <span className="text-gray-500">Всего: <span className="font-medium text-gray-700">{codesResponse?.total || 0}</span></span>
                    <span className="text-green-600">Свободных: <span className="font-medium">{codesResponse?.free_count || 0}</span></span>
                    <span className="text-orange-500">Выданных: <span className="font-medium">{codesResponse?.issued_count || 0}</span></span>
                </div>

                {/* Фильтр */}
                <div className="flex gap-1">
                    {[
                        { value: null, label: 'Все' },
                        { value: 'free', label: 'Свободные' },
                        { value: 'issued', label: 'Выданные' },
                    ].map(f => (
                        <button
                            key={f.value || 'all'}
                            onClick={() => onStatusFilterChange(f.value)}
                            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                                statusFilter === f.value
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Кнопки действий */}
                <div className="flex gap-2">
                    <button
                        onClick={onAddCodesMode}
                        className="flex-1 py-1.5 text-xs font-medium rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                    >
                        + Добавить промокоды
                    </button>
                    {(codesResponse?.free_count || 0) > 0 && (
                        <button
                            onClick={() => onSetConfirmDeleteAllFree(selectedListId)}
                            className="py-1.5 px-3 text-xs font-medium rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Удалить все свободные"
                        >
                            Очистить свободные
                        </button>
                    )}
                </div>
            </div>

            {/* Таблица промокодов */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingCodes ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="loader h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
                        <span className="text-xs text-gray-400 ml-2">Загрузка...</span>
                    </div>
                ) : codes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-sm text-gray-400 text-center">Промокоды ещё не добавлены</p>
                        <button
                            onClick={onAddCodesMode}
                            className="mt-3 px-4 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        >
                            Добавить первые промокоды
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        {/* Заголовок таблицы */}
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Промокод</th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Описание</th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Выдан</th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Кому</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[72px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {codes.map(code => (
                                <tr
                                    key={code.id}
                                    className="hover:bg-gray-50/70 transition-colors group"
                                >
                                    {/* Промокод + статус */}
                                    <td className="py-2 px-3 align-top">
                                        <span className="font-mono font-medium text-gray-800 text-[13px]">{code.code}</span>
                                        <span className={`ml-1.5 inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full align-middle ${
                                            code.status === 'free'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {code.status === 'free' ? 'Свободен' : 'Выдан'}
                                        </span>
                                    </td>

                                    {/* Описание */}
                                    <td className="py-2 px-2 align-top text-gray-500">
                                        <span>{code.description || '—'}</span>
                                    </td>

                                    {/* Дата выдачи */}
                                    <td className="py-2 px-2 align-top text-gray-400 whitespace-nowrap">
                                        {code.issued_at
                                            ? new Date(code.issued_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
                                            : '—'}
                                        {code.issued_at && (
                                            <div className="text-[10px] text-gray-300">
                                                {new Date(code.issued_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </td>

                                    {/* Кому выдан */}
                                    <td className="py-2 px-2 align-top">
                                        {code.status === 'issued' && code.issued_to_user_id ? (
                                            <div className="min-w-0">
                                                <a
                                                    href={`https://vk.com/id${code.issued_to_user_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 font-medium hover:underline truncate block"
                                                    title={`VK ID: ${code.issued_to_user_id}`}
                                                >
                                                    {code.issued_to_user_name || `id${code.issued_to_user_id}`}
                                                </a>
                                                <span className="text-[10px] text-gray-400">ID: {code.issued_to_user_id}</span>
                                            </div>
                                        ) : code.status === 'issued' ? (
                                            <span className="text-gray-400">{code.issued_to_user_name || 'Неизвестный'}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* Кнопки действий */}
                                    <td className="py-2 px-3 align-top">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Чат в системе */}
                                            {code.status === 'issued' && code.issued_to_user_id && onNavigateToChat && (
                                                <button
                                                    onClick={() => onNavigateToChat(code.issued_to_user_id!)}
                                                    className="p-1 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer"
                                                    title="Открыть переписку в мониторинге"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>
                                            )}
                                            {/* ЛС VK */}
                                            {code.status === 'issued' && code.issued_to_user_id && vkGroupId && (
                                                <a
                                                    href={`https://vk.com/gim${vkGroupId}?sel=${code.issued_to_user_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-gray-400 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                                                    title="Открыть переписку в VK"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            )}
                                            {/* Удалить (только свободные) */}
                                            {code.status === 'free' && (
                                                <button
                                                    onClick={() => onSetConfirmDeleteCode(code.id)}
                                                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                                    title="Удалить промокод"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Переменные для шаблонов */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Переменные для шаблонов:</p>
                <div className="flex flex-wrap gap-1">
                    <code className="text-[11px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                        {'{'}promo_{selectedList.slug}_code{'}'}
                    </code>
                    <code className="text-[11px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                        {'{'}promo_{selectedList.slug}_description{'}'}
                    </code>
                </div>
            </div>

            {/* Модалки подтверждения */}
            {confirmDeleteCode && (
                <ConfirmationModal
                    title="Удалить промокод?"
                    message="Промокод будет удалён безвозвратно."
                    onConfirm={() => onDeleteCode(confirmDeleteCode)}
                    onCancel={() => onSetConfirmDeleteCode(null)}
                    confirmText="Удалить"
                    confirmButtonVariant="danger"
                    isConfirming={isDeleting}
                />
            )}
            {confirmDeleteAllFree && (
                <ConfirmationModal
                    title="Удалить все свободные?"
                    message={`Будет удалено ${codesResponse?.free_count || 0} свободных промокодов. Выданные промокоды не затронуты.`}
                    onConfirm={() => onDeleteAllFree(confirmDeleteAllFree)}
                    onCancel={() => onSetConfirmDeleteAllFree(null)}
                    confirmText="Удалить все свободные"
                    confirmButtonVariant="danger"
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};
