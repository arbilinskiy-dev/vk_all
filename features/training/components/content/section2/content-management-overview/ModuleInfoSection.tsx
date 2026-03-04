import React from 'react';

// =====================================================================
// Информация о компонентах модуля + список возможностей пользователя
// =====================================================================
export const ModuleInfoSection: React.FC = () => (
    <>
        {/* Основные компоненты модуля */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Основные компоненты модуля</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Независимо от выбранной вкладки, модуль состоит из <strong>двух главных частей</strong>:
        </p>

        <div className="not-prose space-y-4 my-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-blue-900">1. Сайдбар проектов (вторая колонка)</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Список всех сообществ ВКонтакте с фильтрами, поиском и счётчиками. 
                        Одинаковый для всех вкладок, но счётчики показывают разные данные: 
                        для "Отложенные" — количество черновиков, для "Предложенные" — количество предложенных постов, 
                        для "Товары" счётчиков нет.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-green-900">2. Рабочая область (третья колонка)</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Место, где ты работаешь с контентом. Для "Отложенные" — 
                        календарь с постами, для "Предложенные" — список карточек с предложенными постами, 
                        для "Товары" — таблица со списком товаров.
                    </p>
                </div>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Что ты сможешь делать */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что ты сможешь делать?</h2>

        <div className="not-prose space-y-3 my-6">
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-indigo-900">Планировать публикации</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Создавать системные черновики, отправлять их в VK как отложенные посты, 
                        видеть всё расписание на неделю вперёд.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-purple-900">Работать с предложенными постами</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Просматривать посты от участников сообщества и использовать AI-редактор для подготовки текста к публикации.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-green-900">Управлять товарами</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Редактировать товары сообщества: названия, описания, цены (включая старую цену для скидок), категории, SKU, загружать новые фотографии.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium text-orange-900">Быстро переключаться между проектами</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Использовать сайдбар для мгновенного переключения между разными сообществами.
                    </p>
                </div>
            </div>
        </div>
    </>
);
