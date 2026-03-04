import React from 'react';

// =====================================================================
// Секция «Восемь типов фильтров» — описание всех категорий фильтрации
// =====================================================================
export const FilterTypesSection: React.FC = () => {
    return (
        <>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Восемь типов фильтров</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Система поддерживает 8 категорий фильтрации, каждая из которых работает независимо. Если выбрать несколько фильтров одновременно, система покажет записи, удовлетворяющие <strong>всем</strong> условиям сразу (логическое "И").
            </p>

            {/* Фильтр 1: Статус */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">1. Статус (FilterQuality)</h3>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Все</span>
                            <span className="text-sm text-gray-600">Без фильтрации</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">Активен</span>
                            <span className="text-sm text-gray-600">Пользователь активен и доступен</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded">Забанен</span>
                            <span className="text-sm text-gray-600">Заблокирован администраторами VK</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded">Удалён</span>
                            <span className="text-sm text-gray-600">Профиль удалён пользователем</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Зачем нужно:</strong> Отсеять удалённые или забаненные аккаунты перед массовой рассылкой — иначе система будет пытаться отправить сообщения несуществующим пользователям.
                    </p>
                </div>
            </div>

            {/* Фильтр 2: Пол */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">2. Пол (FilterSex)</h3>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Все</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">Мужской</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded">Женский</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded">Не указан</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Фильтр 3: Возраст */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">3. Возраст (FilterAge)</h3>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded text-center">Любой</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">До 16</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">16-20</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">20-25</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">25-30</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">30-35</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">35-40</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">40-45</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded text-center">45+</span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded text-center">Не указан</span>
                    </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Зачем нужно:</strong> Таргетировать контент под целевую аудиторию. Например, рекламу студенческих скидок показывать только группе 16-25 лет.
                    </p>
                </div>
            </div>

            {/* Фильтр 4: Онлайн */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">4. Последняя активность (FilterOnline)</h3>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Неважно</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">Сегодня</span>
                            <span className="text-sm text-gray-600">Заходил в течение последних 24 часов</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-lime-100 text-lime-700 text-sm rounded">3 дня</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded">Неделя</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded">Месяц</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Зачем нужно:</strong> Найти активных пользователей перед рассылкой — они с большей вероятностью прочитают сообщение и ответят.
                    </p>
                </div>
            </div>

            {/* Фильтр 5: Платформа */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">5. Платформа (FilterPlatform)</h3>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Любая</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">Mobile (1)</span>
                            <span className="text-sm text-gray-600">Мобильная версия сайта</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded">iPhone (2)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">Android (4)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded">Web (7)</span>
                            <span className="text-sm text-gray-600">Браузерная версия</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded">Неизвестно</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Особенность:</strong> Значения 1, 2, 4, 7 — это коды платформ из API ВКонтакте. Система автоматически определяет устройство при последней активности пользователя.
                    </p>
                </div>
            </div>

            {/* Фильтр 6: Месяц рождения */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">6. Месяц рождения (FilterBdateMonth)</h3>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded text-center">Любой</span>
                        <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded text-center">Январь</span>
                        <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded text-center">Февраль</span>
                        <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded text-center">Март</span>
                        <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded text-center">...</span>
                        <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded text-center">Декабрь</span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded text-center">Не указан</span>
                    </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Зачем нужно:</strong> Поздравлять подписчиков с днём рождения. Фильтруете по текущему месяцу и отправляете персонализированное сообщение.
                    </p>
                </div>
            </div>

            {/* Фильтр 7: Доступность сообщений */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">7. Доступность сообщений (FilterCanWrite)</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Доступен только для списка <strong>"В рассылке"</strong>:
            </p>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Все</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded flex items-center gap-1">
                                ✅ Разрешено
                            </span>
                            <span className="text-sm text-gray-600">Можно отправить сообщение</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded flex items-center gap-1">
                                🚫 Запрещено
                            </span>
                            <span className="text-sm text-gray-600">Настройки приватности VK блокируют отправку</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Фильтр 8: Месяц вступления/выхода */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">8. Месяц активности (FilterActionMonth)</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Доступен для списков <strong>"Вступившие"</strong> и <strong>"Вышедшие"</strong>:
            </p>
            <div className="not-prose my-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Доступные опции:</span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded text-center">Любой</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded text-center">Январь 2026</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded text-center">Февраль 2026</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded text-center">...</span>
                    </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Зачем нужно:</strong> Анализировать тренды аудитории по месяцам — например, увидеть массовый отток в определённый период и выяснить причину.
                    </p>
                </div>
            </div>
        </>
    );
};
