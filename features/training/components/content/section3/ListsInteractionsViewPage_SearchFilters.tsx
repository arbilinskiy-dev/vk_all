import React from 'react';

// =====================================================================
// Секция «Поиск и фильтры»
// =====================================================================

/** Блок 5 страницы «Просмотр взаимодействий» — поиск и фильтры */
export const SearchFiltersSection: React.FC = () => (
    <>
        {/* ============================================== */}
        {/* 9. ПОИСК И ФИЛЬТРЫ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Поиск и фильтры</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Над таблицей расположена панель инструментов для поиска и фильтрации пользователей:
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Поле поиска</h3>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Поле с placeholder <strong>"ФИО, ID, ссылка..."</strong> позволяет искать пользователей по:
        </p>

        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>first_name</code> — имя пользователя</li>
            <li><code>last_name</code> — фамилия пользователя</li>
            <li><code>vk_user_id</code> — числовой ID VK</li>
            <li><code>domain</code> — короткая ссылка (username)</li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Доступные фильтры</h3>

        <div className="not-prose my-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Фильтр</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Опции</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Статус</td>
                        <td className="px-4 py-3 text-gray-600">Все, Активные, Забанены, Удалены</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Пол</td>
                        <td className="px-4 py-3 text-gray-600">Любой, Женский, Мужской, Не указан</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Онлайн</td>
                        <td className="px-4 py-3 text-gray-600">Любой, Сегодня, 3 дня, Неделя, Месяц</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Платформа</td>
                        <td className="px-4 py-3 text-gray-600">Любая, m.vk, iPhone, Android, Web, Не определена</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Возраст</td>
                        <td className="px-4 py-3 text-gray-600">Любой, до 16, 16-20, 20-25, 25-30, 30-35, 35-40, 40-45, 45+, Не указан</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Месяц рождения</td>
                        <td className="px-4 py-3 text-gray-600">Любой, Январь...Декабрь, Не указан</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Кнопка "Обновить профили"</h3>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Кнопка с иконкой циркулярных стрелок запускает обновление профилей пользователей из VK API. Это нужно, чтобы получить актуальную информацию о статусах аккаунтов, городах, онлайн-статусе.
        </p>
    </>
);
