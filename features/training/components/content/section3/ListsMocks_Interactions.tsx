import React, { useState } from 'react';

// =====================================================================
// MOCK КОМПОНЕНТ: СТРОКА ТАБЛИЦЫ ВЗАИМОДЕЙСТВИЙ (с раскрытием)
// =====================================================================

interface MockInteractionRowProps {
    interaction: {
        id: string;
        vk_user_id: number;
        photo_url?: string;
        first_name: string;
        last_name: string;
        domain?: string;
        has_mobile?: number;
        sex?: number;
        bdate?: string;
        city?: string;
        last_seen?: number;
        platform?: number;
        deactivated?: string;
        is_closed?: boolean;
        interaction_count: number;
        last_interaction_date: string;
        post_ids?: number[];
    };
}

export const MockInteractionRow: React.FC<MockInteractionRowProps> = ({ interaction }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusBadge = () => {
        if (interaction.deactivated === 'banned') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Заблокир.</span>;
        }
        if (interaction.deactivated === 'deleted') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Удален</span>;
        }
        if (interaction.is_closed) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Закрытый</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Активен</span>;
    };

    const getPlatformBadge = () => {
        if (!interaction.platform) return null;
        
        const platforms: Record<number, { label: string; classes: string }> = {
            1: { label: 'm.vk', classes: 'bg-orange-50 text-orange-700 border-orange-100' },
            2: { label: 'iOS', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
            4: { label: 'Android', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            7: { label: 'Web', classes: 'bg-blue-50 text-blue-700 border-blue-100' }
        };

        const platform = platforms[interaction.platform] || { label: 'Mob', classes: 'bg-gray-50 text-gray-600 border-gray-200' };
        
        return (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ml-2 ${platform.classes}`}>
                {platform.label}
            </span>
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <tr className={`transition-colors cursor-pointer ${
                isExpanded ? 'bg-indigo-50' : 'hover:bg-gray-50'
            }`}>
                {/* Стрелка раскрытия */}
                <td className="px-4 py-3">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-1 rounded hover:bg-gray-200 transition-all ${
                            isExpanded ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                    >
                        <svg 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </td>

                {/* Аватар */}
                <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {interaction.photo_url ? (
                            <img src={interaction.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </td>

                {/* Пользователь */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <a 
                            href={`https://vk.com/${interaction.domain || `id${interaction.vk_user_id}`}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {interaction.first_name} {interaction.last_name}
                        </a>
                        {interaction.has_mobile && (
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <title>Известен номер телефона</title>
                                <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">ID: {interaction.vk_user_id}</div>
                </td>

                {/* Пол */}
                <td className="px-4 py-3 text-sm text-gray-700">
                    {interaction.sex === 1 ? 'Жен.' : interaction.sex === 2 ? 'Муж.' : '—'}
                </td>

                {/* ДР */}
                <td className="px-4 py-3 text-sm text-gray-700">
                    {interaction.bdate || '—'}
                </td>

                {/* Город */}
                <td className="px-4 py-3 text-sm text-gray-700">
                    {interaction.city || '—'}
                </td>

                {/* Онлайн / Платформа */}
                <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                        {interaction.last_seen && (
                            <div className="text-xs text-gray-600">{formatDate(interaction.last_seen)}</div>
                        )}
                        {getPlatformBadge()}
                    </div>
                </td>

                {/* Статус */}
                <td className="px-4 py-3">
                    {getStatusBadge()}
                </td>

                {/* Всего (счётчик) */}
                <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-white border border-gray-300 text-gray-700 shadow-sm">
                        {interaction.interaction_count}
                    </span>
                </td>

                {/* Последняя активность */}
                <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(interaction.last_interaction_date).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </td>
            </tr>

            {/* Раскрытая строка с постами */}
            {isExpanded && (
                <tr className="bg-gray-50/50">
                    <td colSpan={10} className="px-4 py-4">
                        <div className="ml-12">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                История активности ({interaction.post_ids?.length || 0})
                            </h4>
                            {interaction.post_ids && interaction.post_ids.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {interaction.post_ids.map(postId => (
                                        <a
                                            key={postId}
                                            href={`https://vk.com/wall-123456_${postId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 bg-white text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                                        >
                                            Post #{postId}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Нет данных о постах</p>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

// =====================================================================
// MOCK КОМПОНЕНТ: ТАБЛИЦА ВЗАИМОДЕЙСТВИЙ
// =====================================================================

export const MockInteractionsTable: React.FC = () => {
    const mockInteractions = [
        {
            id: '1',
            vk_user_id: 111222333,
            photo_url: 'https://picsum.photos/seed/inter1/100/100',
            first_name: 'Ольга',
            last_name: 'Иванова',
            domain: 'olgaivanova',
            has_mobile: 1,
            sex: 1,
            bdate: '10.5.1992',
            city: 'Москва',
            last_seen: Math.floor(Date.now() / 1000) - 7200,
            platform: 4,
            interaction_count: 15,
            last_interaction_date: new Date().toISOString(),
            post_ids: [12345, 12346, 12347, 12350, 12355]
        },
        {
            id: '2',
            vk_user_id: 444555666,
            first_name: 'Сергей',
            last_name: 'Волков',
            sex: 2,
            city: 'Казань',
            last_seen: Math.floor(Date.now() / 1000) - 172800,
            platform: 2,
            interaction_count: 8,
            last_interaction_date: new Date(Date.now() - 86400000).toISOString(),
            post_ids: [12345, 12348]
        },
        {
            id: '3',
            vk_user_id: 777888999,
            photo_url: 'https://picsum.photos/seed/inter3/100/100',
            first_name: 'Мария',
            last_name: 'Соколова',
            domain: 'mariasokolova',
            sex: 1,
            bdate: '18.11.1998',
            city: 'Новосибирск',
            last_seen: Math.floor(Date.now() / 1000) - 3600,
            platform: 1,
            interaction_count: 23,
            last_interaction_date: new Date(Date.now() - 3600000).toISOString(),
            post_ids: [12345, 12346, 12347, 12348, 12349, 12350, 12351]
        }
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Аватар</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пол</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ДР</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Город</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Онлайн / Платформа</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Всего</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Посл. актив</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mockInteractions.map((interaction) => (
                            <MockInteractionRow key={interaction.id} interaction={interaction} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
