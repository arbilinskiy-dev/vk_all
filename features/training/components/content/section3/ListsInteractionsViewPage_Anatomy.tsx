import React from 'react';
import { Sandbox } from '../shared';

// =====================================================================
// Секция «Анатомия таблицы» + «Структура данных взаимодействия»
// =====================================================================

/** Блок 2 страницы «Просмотр взаимодействий» — анатомия и структура данных */
export const AnatomySection: React.FC = () => (
    <>
        {/* ============================================== */}
        {/* 2. АНАТОМИЯ ТАБЛИЦЫ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Анатомия таблицы</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Таблица взаимодействий состоит из 4 функциональных зон:
        </p>

        <Sandbox
            title="Структура таблицы взаимодействий"
            description="Наведите курсор на цветные рамки, чтобы понять назначение каждой зоны"
            instructions={[
                '<strong>Зона 1 (фиолетовая)</strong> — панель поиска, фильтров и кнопка обновления профилей',
                '<strong>Зона 2 (синяя)</strong> — заголовки колонок, закреплены при прокрутке (sticky)',
                '<strong>Зона 3 (зелёная)</strong> — строки с данными пользователей, прокручиваемая область',
                '<strong>Зона 4 (оранжевая)</strong> — индикатор автоподгрузки следующей порции данных',
            ]}
        >
            <div className="text-center text-gray-500 py-8">
                <p>Интерактивная демонстрация структуры таблицы будет добавлена позже</p>
            </div>
        </Sandbox>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Описание колонок таблицы</h3>

        <div className="not-prose my-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">№</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Название</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">Ширина</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Что отображается</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">1</td>
                        <td className="px-4 py-3 text-gray-700">(Раскрытие)</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">w-10</code></td>
                        <td className="px-4 py-3 text-gray-600">Стрелка для раскрытия/сворачивания строки</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">2</td>
                        <td className="px-4 py-3 text-gray-700">(Аватар)</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">w-16</code></td>
                        <td className="px-4 py-3 text-gray-600">Круглое фото 40×40px или SVG-заглушка</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">3</td>
                        <td className="px-4 py-3 text-gray-700">Пользователь</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">flex-grow</code></td>
                        <td className="px-4 py-3 text-gray-600">ФИО (синяя ссылка на VK) + ID/domain + иконка телефона</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">4</td>
                        <td className="px-4 py-3 text-gray-700">Пол</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">"Жен." / "Муж." / "—"</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">5</td>
                        <td className="px-4 py-3 text-gray-700">ДР</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">Дата рождения "15.3.1995" или "—"</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">6</td>
                        <td className="px-4 py-3 text-gray-700">Город</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">Название города или "—"</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">7</td>
                        <td className="px-4 py-3 text-gray-700">Онлайн</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">Дата/время последнего онлайна + цветной бейдж платформы</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">8</td>
                        <td className="px-4 py-3 text-gray-700">Статус</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">Цветной бейдж: Активен / Закрытый / Удален / Заблокирован</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">9</td>
                        <td className="px-4 py-3 text-gray-700">Всего</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">Белый бейдж со счётчиком взаимодействий</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">10</td>
                        <td className="px-4 py-3 text-gray-700">Посл. актив</td>
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">auto</code></td>
                        <td className="px-4 py-3 text-gray-600">Дата и время последнего взаимодействия</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ============================================== */}
        {/* 3. СТРУКТУРА ДАННЫХ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Структура данных взаимодействия</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Каждая строка таблицы представляет собой объект типа <code>SystemListInteraction</code>, который содержит информацию о пользователе и его активности:
        </p>

        <div className="not-prose my-6 bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-sm text-gray-100 leading-relaxed"><code>{`export interface SystemListInteraction {
    id: string;                      // Внутренний ID в базе данных
    vk_user_id: number;              // ID пользователя ВКонтакте
    first_name: string;              // Имя пользователя
    last_name: string;               // Фамилия пользователя
    domain?: string;                 // Короткая ссылка (username)
    photo_url?: string;              // URL аватара пользователя
    interaction_count: number;       // Общее количество взаимодействий
    last_interaction_date: string;   // Дата последнего взаимодействия (ISO)
    post_ids?: number[];             // Массив ID постов
    sex?: number;                    // Пол: 1 - женский, 2 - мужской
    bdate?: string;                  // Дата рождения "15.3.1995"
    city?: string;                   // Город пользователя
    last_seen?: number;              // Последний онлайн (Unix timestamp)
    platform?: number;               // Платформа последнего онлайна (1-7)
    deactivated?: string;            // "banned" | "deleted"
    is_closed?: boolean;             // Закрытый профиль
    has_mobile?: number;             // Известен номер телефона (1/0)
}`}</code></pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Пояснение ключевых полей</h3>

        <div className="not-prose my-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Поле</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Что означает</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Пример</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">interaction_count</code></td>
                        <td className="px-4 py-3 text-gray-600">Сколько раз пользователь лайкал/комментировал/репостил посты сообщества за период</td>
                        <td className="px-4 py-3"><span className="font-mono text-gray-700">23</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">post_ids</code></td>
                        <td className="px-4 py-3 text-gray-600">Список ID постов, с которыми взаимодействовал пользователь (показывается при раскрытии строки)</td>
                        <td className="px-4 py-3"><span className="font-mono text-gray-700">[12345, 12346]</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">platform</code></td>
                        <td className="px-4 py-3 text-gray-600">С какого устройства пользователь последний раз заходил в VK (1-m.vk, 2-iPhone, 4-Android, 7-Web)</td>
                        <td className="px-4 py-3"><span className="font-mono text-gray-700">2</span> (iPhone)</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">deactivated</code></td>
                        <td className="px-4 py-3 text-gray-600">Если профиль удалён или заблокирован — значение "deleted" или "banned"</td>
                        <td className="px-4 py-3"><span className="font-mono text-gray-700">"banned"</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">has_mobile</code></td>
                        <td className="px-4 py-3 text-gray-600">ВКонтакте знает номер телефона пользователя (показатель надёжности аккаунта)</td>
                        <td className="px-4 py-3"><span className="font-mono text-gray-700">1</span> (есть)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </>
);
