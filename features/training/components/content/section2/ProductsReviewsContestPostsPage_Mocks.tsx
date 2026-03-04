import React, { useState } from 'react';
import type { ParticipantStatus, ResultType, MockEntry } from './ProductsReviewsContestPostsPage_Types';

// =====================================================================
// MOCK-КОМПОНЕНТЫ: Статусные badge
// =====================================================================

export const StatusBadge: React.FC<{ status: ParticipantStatus }> = ({ status }) => {
    switch (status) {
        case 'new': return <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">Новый</span>;
        case 'processing': return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100 animate-pulse">В работе</span>;
        case 'commented': return <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs border border-green-100">Принят</span>;
        case 'error': return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">Ошибка</span>;
        case 'winner': return <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">Победитель</span>;
        case 'used': return <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded text-xs border border-gray-200">Использован</span>;
    }
};

// =====================================================================
// MOCK-КОМПОНЕНТЫ: Таблица участников
// =====================================================================

export const MockPostsTable: React.FC<{ entries: MockEntry[] }> = ({ entries }) => {
    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="text-sm text-gray-500">
                    Найдено участников: <strong>{entries.length}</strong>
                </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <p>Список пуст.</p>
                        <p className="text-sm mt-1">Нажмите "Собрать посты", чтобы найти участников.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">№</th>
                                <th className="px-4 py-3 w-16">Фото</th>
                                <th className="px-4 py-3 w-48">Автор</th>
                                <th className="px-4 py-3">Текст поста</th>
                                <th className="px-4 py-3 w-32">Статус</th>
                                <th className="px-4 py-3 w-40">Дата</th>
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {entries.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-center font-bold text-gray-700">
                                        {p.entry_number || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.user_photo ? (
                                            <img src={p.user_photo} className="w-8 h-8 rounded-full" alt="" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <a href={`https://vk.com/id${p.user_vk_id}`} target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline truncate">
                                            {p.user_name}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800">
                                        <p className="truncate max-w-xs" title={p.post_text}>{p.post_text}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={p.status} />
                                        {p.status === 'error' && (
                                            <div className="text-[10px] text-red-500 mt-1">Ошибка VK</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(p.created_at).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <a 
                                            href={p.post_link} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="Открыть пост ВКонтакте"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// =====================================================================
// MOCK-КОМПОНЕНТЫ: Кнопки управления
// =====================================================================

export const MockControlButtons: React.FC<{ newCount: number; readyCount: number }> = ({ newCount, readyCount }) => {
    const [isCollecting, setIsCollecting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleCollect = () => {
        setIsCollecting(true);
        setTimeout(() => {
            setIsCollecting(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }, 1500);
    };

    const handleProcess = () => {
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 1500);
    };

    return (
        <div className="flex gap-2">
            <button 
                className="p-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                title="Обновить список"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                </svg>
            </button>

            <button 
                onClick={handleProcess}
                disabled={isProcessing || newCount === 0}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400 flex items-center gap-2 shadow-sm transition-colors"
                title="Присвоить номера новым участникам"
            >
                {isProcessing ? (
                    <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                )}
                Прокомментировать ({newCount})
            </button>
            
            <button 
                disabled={readyCount === 0}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400 flex items-center gap-2 shadow-sm transition-colors"
                title="Выбрать победителя и опубликовать итоги"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Подвести итоги ({readyCount})
            </button>

            <button 
                onClick={handleCollect}
                disabled={isCollecting}
                className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2 shadow-sm"
            >
                {isCollecting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                )}
                Собрать посты
            </button>

            {showToast && (
                <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-md shadow-lg text-sm">
                    ✓ Сбор постов завершен
                </div>
            )}
        </div>
    );
};

// =====================================================================
// MOCK-КОМПОНЕНТЫ: Всплывающее окно результата
// =====================================================================

export const MockResultModal: React.FC<{ type: ResultType; onClose: () => void }> = ({ type, onClose }) => {
    let title = "";
    let iconClass = "";
    let icon = null;
    let content = null;

    if (type === 'error') {
        title = "Ошибка!";
        iconClass = "text-red-600 bg-red-100";
        icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
        content = (
            <div className="text-center">
                <p className="text-gray-700 mb-4">Не удалось подвести итоги конкурса</p>
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    Возможные причины:
                    <ul className="list-disc list-inside mt-1 text-left px-2">
                        <li>Закончились свободные промокоды.</li>
                        <li>Все участники находятся в черном списке.</li>
                        <li>Ошибка доступа к API (проверьте токены).</li>
                    </ul>
                </div>
            </div>
        );
    } else if (type === 'skipped') {
        title = "Розыгрыш перенесен";
        iconClass = "text-amber-600 bg-amber-100";
        icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
        content = (
            <div className="text-center">
                <p className="text-gray-700">Условия завершения не выполнены.</p>
                <p className="text-sm text-gray-500 mt-2">Конкурс продолжится до следующего запуска.</p>
            </div>
        );
    } else {
        title = "Успешно!";
        iconClass = "text-green-600 bg-green-100";
        icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        );
        content = (
            <div className="text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">Победитель выбран:</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">Иван Петров</p>
                </div>
                
                <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Открыть пост с итогами
                </button>
                
                <p className="text-xs text-gray-500">Приз отправлен победителю. Подробности в журнале отправки.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-fade-in-up overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${iconClass}`}>
                            {icon}
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-4">{title}</h3>
                    {content}
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-center">
                    <button 
                        onClick={onClose}
                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

// =====================================================================
// Mock-данные для песочницы (таблица участников)
// =====================================================================

export const MOCK_CONTEST_ENTRIES: MockEntry[] = [
    {
        id: '1',
        entry_number: 1,
        user_photo: 'https://picsum.photos/seed/user1/64/64',
        user_name: 'Анна Смирнова',
        user_vk_id: 123456,
        post_text: 'Отличный товар! Использую уже месяц, всем рекомендую 👍',
        post_link: 'https://vk.com/wall-123456_789',
        status: 'commented',
        created_at: '2026-02-15T10:30:00'
    },
    {
        id: '2',
        user_photo: 'https://picsum.photos/seed/user2/64/64',
        user_name: 'Дмитрий Козлов',
        user_vk_id: 234567,
        post_text: 'Купил на днях, качество супер! #конкурс',
        post_link: 'https://vk.com/wall-123456_790',
        status: 'new',
        created_at: '2026-02-16T14:20:00'
    },
    {
        id: '3',
        entry_number: 2,
        user_photo: 'https://picsum.photos/seed/user3/64/64',
        user_name: 'Елена Волкова',
        user_vk_id: 345678,
        post_text: 'Спасибо за качественный продукт!',
        post_link: 'https://vk.com/wall-123456_791',
        status: 'winner',
        created_at: '2026-02-14T09:15:00'
    },
    {
        id: '4',
        user_name: 'Игорь Петров',
        user_vk_id: 456789,
        post_text: 'Очень доволен покупкой!',
        post_link: 'https://vk.com/wall-123456_792',
        status: 'error',
        created_at: '2026-02-17T16:45:00'
    },
    {
        id: '5',
        entry_number: 3,
        user_photo: 'https://picsum.photos/seed/user5/64/64',
        user_name: 'Мария Белова',
        user_vk_id: 567890,
        post_text: 'Рекомендую всем! #лучшийтовар',
        post_link: 'https://vk.com/wall-123456_793',
        status: 'used',
        created_at: '2026-02-13T11:00:00'
    }
];
