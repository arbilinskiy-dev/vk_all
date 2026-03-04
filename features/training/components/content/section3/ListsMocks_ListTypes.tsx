import React from 'react';
import {
    UsersIcon, MessageIcon, UserPlusIcon, UserMinusIcon,
    HeartIcon, ShareIcon, TrophyIcon, DocumentIcon, PenIcon
} from './ListsMocks_Icons';

// =====================================================================
// MOCK КОМПОНЕНТ: КАРТОЧКА ТИПА СПИСКА С ПОЛНЫМ ОПИСАНИЕМ
// =====================================================================

interface ListTypeCardProps {
    type: string;
    title: string;
    description: string;
    group: string;
    color: string;
    icon: React.ReactNode;
    source: string;
    apiMethod?: string;
}

export const ListTypeCard: React.FC<ListTypeCardProps> = ({ 
    type, 
    title, 
    description, 
    group, 
    color, 
    icon, 
    source, 
    apiMethod 
}) => {
    const groupColors: Record<string, string> = {
        'Подписчики': 'border-indigo-200 bg-indigo-50/30',
        'Активности': 'border-pink-200 bg-pink-50/30',
        'Автоматизации': 'border-amber-200 bg-amber-50/30',
        'Прочее': 'border-violet-200 bg-violet-50/30'
    };

    return (
        <div className={`border-2 rounded-lg p-4 ${groupColors[group] || 'border-gray-200 bg-gray-50'}`}>
            {/* Заголовок с иконкой */}
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 mb-1">{title}</h4>
                    <p className="text-xs text-gray-500 font-mono">{type}</p>
                </div>
            </div>

            {/* Описание */}
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{description}</p>

            {/* Метаинформация */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-600">Группа:</span>
                    <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-gray-700">{group}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-600">Источник:</span>
                    <span className="text-gray-700">{source}</span>
                </div>
                {apiMethod && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-gray-600">VK API:</span>
                        <code className="px-2 py-0.5 bg-gray-900 text-green-400 rounded font-mono">{apiMethod}</code>
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================================
// MOCK КОМПОНЕНТ: СЕТКА ВСЕХ ТИПОВ СПИСКОВ
// =====================================================================

export const AllListTypesGrid: React.FC = () => {
    const listTypes = [
        // ГРУППА: ПОДПИСЧИКИ
        {
            type: 'subscribers_of_group',
            title: 'Подписчики',
            description: 'Текущие подписчики сообщества. Загружаются через groups.getMembers батчами по 1000.',
            group: 'Подписчики',
            color: 'bg-indigo-500',
            icon: <UsersIcon />,
            source: 'VK API → groups.getMembers',
            apiMethod: 'groups.getMembers'
        },
        {
            type: 'mailing',
            title: 'В рассылке',
            description: 'Пользователи с активным диалогом. Статус can_write определяет возможность отправки сообщений.',
            group: 'Подписчики',
            color: 'bg-cyan-600',
            icon: <MessageIcon />,
            source: 'VK API → messages.getConversations',
            apiMethod: 'messages.getConversations'
        },
        {
            type: 'history_join',
            title: 'Вступившие (История)',
            description: 'Все кто когда-либо вступал. Автоматически пополняется при сравнении списков подписчиков.',
            group: 'Подписчики',
            color: 'bg-teal-500',
            icon: <UserPlusIcon />,
            source: 'Автоматически при синхронизации подписчиков'
        },
        {
            type: 'history_leave',
            title: 'Вышедшие (История)',
            description: 'Все кто покинул сообщество. Детектируется как разница между старым и новым списком.',
            group: 'Подписчики',
            color: 'bg-orange-500',
            icon: <UserMinusIcon />,
            source: 'Автоматически при синхронизации подписчиков'
        },
        // ГРУППА: АКТИВНОСТИ
        {
            type: 'post_likers',
            title: 'Лайкали',
            description: 'Пользователи лайкнувшие посты. Быстрое сканирование первых 1000, глубокое — если больше.',
            group: 'Активности',
            color: 'bg-pink-500',
            icon: <HeartIcon />,
            source: 'VK API → likes.getList (через execute)',
            apiMethod: 'likes.getList'
        },
        {
            type: 'post_commenters',
            title: 'Комментировали',
            description: 'Авторы комментариев под постами. Собирается с extended=1 для получения профилей.',
            group: 'Активности',
            color: 'bg-blue-500',
            icon: <MessageIcon />,
            source: 'VK API → wall.getComments',
            apiMethod: 'wall.getComments'
        },
        {
            type: 'post_reposters',
            title: 'Репостили',
            description: 'Пользователи сделавшие репост. Требует токен администратора (level 3) для доступа к API.',
            group: 'Активности',
            color: 'bg-purple-500',
            icon: <ShareIcon />,
            source: 'VK API → wall.getReposts (только админ)',
            apiMethod: 'wall.getReposts'
        },
        // ГРУППА: АВТОМАТИЗАЦИИ
        {
            type: 'contest_winners',
            title: 'Конкурс отзывов: Победители',
            description: 'Победители конкурса со статусом "winner" в таблице general_contest_entries.',
            group: 'Автоматизации',
            color: 'bg-amber-500',
            icon: <TrophyIcon />,
            source: 'Внутренняя БД → general_contest_entries (status=winner)'
        },
        {
            type: 'contest_participants',
            title: 'Конкурс отзывов: Участники',
            description: 'Все участники конкурса (статус "participant" или "winner").',
            group: 'Автоматизации',
            color: 'bg-green-500',
            icon: <UsersIcon />,
            source: 'Внутренняя БД → general_contest_entries'
        },
        {
            type: 'contest_posts',
            title: 'Конкурс отзывов: Посты',
            description: 'Посты с отзывами участников. Показывается только счётчик постов из contest_entries.',
            group: 'Автоматизации',
            color: 'bg-indigo-400',
            icon: <MessageIcon />,
            source: 'Внутренняя БД → general_contest_entries (подсчёт)'
        },
        // ГРУППА: ПРОЧЕЕ
        {
            type: 'posts_history',
            title: 'История постов',
            description: 'Архив постов со стены с метриками. Двойной счётчик: в БД vs всего в VK. Режимы: 1000 (быстро) или all (долго).',
            group: 'Прочее',
            color: 'bg-indigo-800',
            icon: <DocumentIcon />,
            source: 'VK API → wall.get',
            apiMethod: 'wall.get'
        },
        {
            type: 'post_authors',
            title: 'Авторы постов',
            description: 'Уникальные пользователи из signer_id и post_author_id. Извлекается автоматически при синхронизации постов.',
            group: 'Прочее',
            color: 'bg-violet-600',
            icon: <PenIcon />,
            source: 'Автоматически из wall.get + users.get'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listTypes.map((listType) => (
                <ListTypeCard key={listType.type} {...listType} />
            ))}
        </div>
    );
};

// =====================================================================
// MOCK КОМПОНЕНТ: ТАБЛИЦА СРАВНЕНИЯ ТИПОВ
// =====================================================================

export const ListTypesComparisonTable: React.FC = () => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип списка</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Когда использовать</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Обновление</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Особенности</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Подписчики</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Рассылки, анализ аудитории, сегментация</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Раз в день</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Базовый список, всегда актуален</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">В рассылке</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Таргетированные сообщения, активные диалоги</td>
                            <td className="px-4 py-3 text-sm text-gray-600">По запросу</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Показывает can_write статус</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Вступившие / Вышедшие</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Отслеживание динамики, анализ оттока</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Автоматически</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Только для истории, не редактируется</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Лайкали</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Поиск активной аудитории, ретаргетинг</td>
                            <td className="px-4 py-3 text-sm text-gray-600">2–4 часа</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Быстрое сканирование 1000 лайков</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Комментировали</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Вовлечённая аудитория, обратная связь</td>
                            <td className="px-4 py-3 text-sm text-gray-600">2–4 часа</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Батчи по 100 комментариев</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Репостили</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Амбассадоры бренда, виральность</td>
                            <td className="px-4 py-3 text-sm text-gray-600">По запросу</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Требует токен администратора</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Конкурс: Победители</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Награждение, персональные сообщения</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Не требуется</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Управляется вручную в конкурсе</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Конкурс: Участники</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Общая рассылка участникам</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Не требуется</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Включает победителей</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">История постов</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Аналитика контента, поиск трендов</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Раз в несколько дней</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Режимы: 1000 (быстро) или all (долго)</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Авторы постов</td>
                            <td className="px-4 py-3 text-sm text-gray-700">Поиск авторов контента, координация</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Автоматически</td>
                            <td className="px-4 py-3 text-sm text-gray-500">Извлекается из signer_id при синхронизации</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
