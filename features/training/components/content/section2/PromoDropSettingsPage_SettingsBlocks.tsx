import React from 'react';

/**
 * Секция «Какие настройки будут на этой странице» —
 * 4 блока: основные параметры, база промокодов, шаблоны сообщений, защита от накруток.
 */
export const PromoDropSettingsPage_SettingsBlocks: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Какие настройки будут на этой странице
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Когда функционал будет реализован, на странице настроек появятся следующие блоки:
        </p>

        <div className="not-prose my-6 space-y-4">
            {/* Блок 1: Основные параметры */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-2">1. Основные параметры</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Базовые настройки для запуска дропа: где искать участников и когда остановить раздачу.
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-500 mt-1">→</span>
                                <span><strong>Ссылка на пост:</strong> URL поста ВКонтакте, под которым будет проходить дроп</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-500 mt-1">→</span>
                                <span><strong>Ключевое слово:</strong> Слово или фраза для активации (например, "ХОЧУПРИЗ" или "#скидка20")</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-500 mt-1">→</span>
                                <span><strong>Количество призов:</strong> Сколько промокодов раздать (например, первым 10 участникам)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-500 mt-1">→</span>
                                <span><strong>Временной диапазон:</strong> Когда начать и когда остановить мониторинг (опционально)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Блок 2: База промокодов */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-2">2. База промокодов</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Управление списком промокодов, которые будут раздаваться победителям.
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">→</span>
                                <span><strong>Загрузка из файла:</strong> CSV или TXT файл со списком промокодов (один код на строку)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">→</span>
                                <span><strong>Ручное добавление:</strong> Возможность добавить коды прямо в интерфейсе</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">→</span>
                                <span><strong>Просмотр остатка:</strong> Сколько кодов осталось и какие уже использованы</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">→</span>
                                <span><strong>Дублирование защита:</strong> Система не отправит один код дважды</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Блок 3: Шаблоны сообщений */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-2">3. Шаблоны сообщений</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Настройка текста, который система будет отправлять участникам в личные сообщения.
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">→</span>
                                <span><strong>Сообщение победителю:</strong> Текст с промокодом (например: "Поздравляем! Ваш код: {'{'+ 'CODE' + '}'}")</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">→</span>
                                <span><strong>Сообщение опоздавшим:</strong> Что отправить, если призы закончились</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">→</span>
                                <span><strong>Переменные:</strong> Автоподстановка имени, кода, даты (как в конкурсе отзывов)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">→</span>
                                <span><strong>Эмодзи и форматирование:</strong> Поддержка смайликов и переносов строк</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Блок 4: Защита от накруток */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-2">4. Защита от накруток</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Фильтры для защиты от ботов, накрутчиков и нечестных участников.
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">→</span>
                                <span><strong>Черный список:</strong> Исключить определенных пользователей из участия</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">→</span>
                                <span><strong>Возраст аккаунта:</strong> Минимальный возраст страницы ВК (например, от 3 месяцев)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">→</span>
                                <span><strong>Подписка на сообщество:</strong> Участвовать могут только подписчики</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">→</span>
                                <span><strong>Лимит на пользователя:</strong> Один человек может выиграть только 1 раз (по умолчанию)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
