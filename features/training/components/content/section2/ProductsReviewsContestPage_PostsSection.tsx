/**
 * Секция «Посты» страницы обучения «Конкурс отзывов».
 * Содержит описание статусов, кнопок управления и mock-таблицу участников.
 */
import React from 'react';
import { Sandbox } from '../shared';
import { StatusBadge, ParticipantsTableMock } from './ReviewsContestMocks';

/** Mock-данные участников для демонстрации таблицы */
const mockParticipants = [
    { id: 1, photo: 'https://via.placeholder.com/40', author: 'Мария Смирнова', text: 'Заказали пиццу, очень понравилось! #отзыв', status: 'commented' as const, date: '18.02.2026 14:30' },
    { id: 2, photo: 'https://via.placeholder.com/40', author: 'Иван Петров', text: 'Доставка быстрая, сет роллов супер! #отзыв', status: 'new' as const, date: '18.02.2026 15:12' },
    { id: 3, photo: 'https://via.placeholder.com/40', author: 'Елена Козлова', text: 'Спасибо за акцию! #отзыв', status: 'winner' as const, date: '18.02.2026 16:45' }
];

export const PostsSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Вкладка "Посты"</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Здесь отображаются все найденные посты с ключевым словом. Каждый пост имеет <strong>статус</strong>, 
            который показывает текущий этап обработки.
        </p>

        {/* Статусы участников */}
        <div className="not-prose my-6 bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">📊 Статусы участников:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                    <StatusBadge status="new" />
                    <span className="text-xs text-gray-600">Найден, но не обработан</span>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status="processing" />
                    <span className="text-xs text-gray-600">Система отправляет комментарий</span>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status="commented" />
                    <span className="text-xs text-gray-600">Участник зарегистрирован</span>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status="error" />
                    <span className="text-xs text-gray-600">Ошибка регистрации</span>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status="winner" />
                    <span className="text-xs text-gray-600">Выбран победителем</span>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status="used" />
                    <span className="text-xs text-gray-600">Промокод выдан</span>
                </div>
            </div>
        </div>

        {/* Кнопки управления */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Кнопки управления</h3>
        <div className="not-prose my-6">
            <div className="flex flex-wrap gap-3 mb-4">
                <button className="px-4 py-2 text-sm font-medium rounded-md text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>
                    Обновить
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-md border-green-600 text-green-700 bg-white border hover:bg-green-50 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    Прокомментировать (2)
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-md border-amber-500 text-amber-600 bg-white border hover:bg-amber-50 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    Подвести итоги (1)
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Собрать посты
                </button>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>Обновить:</strong> Перезагрузить таблицу с актуальными данными</li>
                <li><strong>Прокомментировать:</strong> Зарегистрировать все новые посты (отправить комментарии с номерами)</li>
                <li><strong>Подвести итоги:</strong> Выбрать победителя из зарегистрированных участников</li>
                <li><strong>Собрать посты:</strong> Найти новые посты с ключевым словом во ВКонтакте</li>
            </ul>
        </div>

        {/* Таблица участников */}
        <Sandbox
            title="Пример таблицы участников"
            description="Так выглядит список собранных постов. Обратите внимание на разные статусы."
        >
            <ParticipantsTableMock data={mockParticipants} />
        </Sandbox>
    </section>
);
