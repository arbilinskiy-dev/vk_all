/**
 * Секция «Блэклист» страницы обучения «Конкурс отзывов».
 * Содержит описание ручного и автоматического добавления в ЧС,
 * а также mock-пример записей чёрного списка.
 */
import React from 'react';

export const BlacklistSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Вкладка "Блэклист"</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Управление пользователями, которые не могут участвовать в конкурсах. 
            Блокировка может быть <strong>временной</strong> (до определенной даты) или <strong>постоянной</strong>.
        </p>

        {/* Добавление в ЧС */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Добавление в черный список</h3>
        <div className="not-prose my-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-red-900 mb-3">Как добавить пользователя:</p>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                <li>Нажмите кнопку <strong>"Добавить в ЧС"</strong></li>
                <li>Вставьте <strong>ссылку на профиль VK</strong> или прямой ID (например, <code>id123456</code>)</li>
                <li>Выберите срок блокировки:
                    <ul className="ml-6 mt-1 space-y-1 list-disc">
                        <li><strong>Навсегда</strong> — пользователь никогда не сможет участвовать</li>
                        <li><strong>До даты</strong> — блокировка автоматически снимется в указанный день</li>
                    </ul>
                </li>
                <li>Нажмите <strong>"Сохранить"</strong></li>
            </ol>
        </div>

        {/* Авто-добавление */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Автоматическое добавление</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Если в настройках включено <strong>"Авто-добавление в ЧС после победы"</strong>, 
            то каждый победитель автоматически блокируется на N дней. Это предотвращает повторные победы одних и тех же людей.
        </p>

        {/* Пример записей */}
        <div className="not-prose my-6">
            <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold text-gray-800">Пример записи в черном списке</h4>
                        <p className="text-xs text-gray-500">Как отображаются заблокированные пользователи</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {/* Активная блокировка */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">М</div>
                            <div>
                                <p className="font-medium text-gray-800">Мария Смирнова</p>
                                <p className="text-xs text-gray-500">ID: 123456 • Добавлен: 18.02.2026</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">До: <strong>25.02.2026</strong></span>
                            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Удалить">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                    {/* Истекшая блокировка */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">И</div>
                            <div>
                                <p className="font-medium text-gray-800 line-through">Иван Петров</p>
                                <p className="text-xs text-gray-500">ID: 654321 • Добавлен: 11.02.2026</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Истек</span>
                            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Удалить">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    ⚡ Записи с истекшим сроком блокировки отображаются полупрозрачными и зачеркнутыми
                </p>
            </div>
        </div>
    </section>
);
