import React from 'react';

// =====================================================================
// Секция «Структура раздела: 7 вкладок» с интерактивным переключателем
// =====================================================================

/** Допустимые значения вкладок */
export type TabKey = 'settings' | 'posts' | 'winners';

interface TabsStructureSectionProps {
    /** Текущая выбранная вкладка */
    selectedTab: TabKey;
    /** Переключить вкладку */
    onSelectTab: (tab: TabKey) => void;
}

export const TabsStructureSection: React.FC<TabsStructureSectionProps> = ({
    selectedTab,
    onSelectTab,
}) => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Структура раздела: 7 вкладок
        </h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Весь функционал конкурса разделён на 7 вкладок для удобной навигации:
        </p>

        <div className="not-prose mt-6">
            {/* Переключатель вкладок */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => onSelectTab('settings')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            selectedTab === 'settings'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        ⚙️ Настройки
                    </button>
                    <button
                        onClick={() => onSelectTab('posts')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            selectedTab === 'posts'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        📋 Посты
                    </button>
                    <button
                        onClick={() => onSelectTab('winners')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            selectedTab === 'winners'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        🏆 Победители
                    </button>
                </div>
            </div>

            {/* Описание вкладок */}
            <div className="space-y-4">
                {selectedTab === 'settings' && <SettingsTabContent />}
                {selectedTab === 'posts' && <PostsTabContent />}
                {selectedTab === 'winners' && <WinnersTabContent />}
            </div>

            {/* Оставшиеся 4 вкладки */}
            <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">🚫 Блэклист</h4>
                    <p className="text-sm text-gray-600">
                        Список пользователей, исключённых из конкурса. Можно добавлять вручную или автоматически при повторном участии.
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">🎟️ Промокоды</h4>
                    <p className="text-sm text-gray-600">
                        Управление промокодами для призов. Можно импортировать список и автоматически выдавать победителям.
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">📤 Лист отправок</h4>
                    <p className="text-sm text-gray-600">
                        Пользователи, которым будут отправлены сообщения о победе. Формируется автоматически при проведении розыгрыша.
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">📜 Логи</h4>
                    <p className="text-sm text-gray-600">
                        Детальная история всех действий системы: сбор постов, комментирование, выбор победителей, ошибки.
                    </p>
                </div>
            </div>
        </div>
    </section>
);

// ─── Вспомогательные компоненты содержимого вкладок ─────────────────

/** Контент вкладки «Настройки» */
const SettingsTabContent: React.FC = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">⚙️ Настройки</h3>
        <p className="text-sm text-gray-700 mb-4">
            Основная вкладка для настройки условий конкурса:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Активность:</strong> включение/выключение конкурса</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Ключевые слова:</strong> по каким словам искать отзывы (автоматически берутся из названий товаров)</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Даты:</strong> начало конкурса и условия завершения</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Условие завершения:</strong> по количеству участников, по дате или смешанный режим</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Шаблоны:</strong> тексты комментариев, сообщений победителям, постов с результатами</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Автоматический черный список:</strong> исключение повторных участников на заданный период</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Предпросмотр:</strong> как будут выглядеть отправленные сообщения</span>
            </li>
        </ul>
    </div>
);

/** Контент вкладки «Посты» */
const PostsTabContent: React.FC = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Посты</h3>
        <p className="text-sm text-gray-700 mb-4">
            Таблица всех участников конкурса с возможностью управления:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Список участников:</strong> пользователь, текст отзыва, дата, статус</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Статусы:</strong> Новый, В работе, Принят, Ошибка, Победитель, Использован</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Кнопка "Собрать посты":</strong> запуск поиска новых отзывов</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Кнопка "Комментировать":</strong> отправить комментарий к отзыву участника</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Кнопка "Провести розыгрыш":</strong> выбрать победителей среди принятых участников</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Очистка списка:</strong> удаление всех записей (только для администраторов)</span>
            </li>
        </ul>
    </div>
);

/** Контент вкладки «Победители» */
const WinnersTabContent: React.FC = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">🏆 Победители</h3>
        <p className="text-sm text-gray-700 mb-4">
            История всех проведённых розыгрышей:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Дата розыгрыша:</strong> когда был проведён конкурс</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Победитель:</strong> имя пользователя со ссылкой на профиль</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Текст отзыва:</strong> за что был выигран приз</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Ссылка на отзыв:</strong> открывается во ВКонтакте</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Ссылка на пост:</strong> открывается пост с результатами в сообществе</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Статус выдачи:</strong> выдан ли приз победителю</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span><strong>Цветовая схема:</strong> янтарный стиль (amber) для выделения важности</span>
            </li>
        </ul>
    </div>
);
