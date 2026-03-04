import React from 'react';

// =====================================================================
// Секция «Кнопки действий» — описание массовых операций над данными
// =====================================================================
export const ActionButtonsSection: React.FC = () => {
    return (
        <>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Кнопки действий</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Под панелью фильтров расположены кнопки для массовых операций над отфильтрованными данными:
            </p>

            <div className="not-prose my-6 space-y-4">
                {/* Обновить детали */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-bold text-gray-900">Обновить детали</span>
                    </div>
                    <p className="text-sm text-gray-700">
                        Для списков пользователей — загружает свежие данные профилей из VK (аватары, имена, город, возраст). Используется, когда основной список уже синхронизирован, но нужны актуальные детали.
                    </p>
                </div>

                {/* Анализ */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-bold text-gray-900">Анализ</span>
                    </div>
                    <p className="text-sm text-gray-700">
                        Только для списка <strong>"В рассылке"</strong>. Открывает выпадающее меню с опциями анализа аудитории (например, статистика по полу, возрасту, городам).
                    </p>
                </div>

                {/* Синхронизация взаимодействий */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="font-bold text-gray-900">Синхронизация взаимодействий</span>
                    </div>
                    <p className="text-sm text-gray-700">
                        Для списков активностей (Лайкали, Комментировали, Репостили). Загружает ID постов, с которыми взаимодействовал каждый пользователь.
                    </p>
                </div>

                {/* Очистить базу */}
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="font-bold text-gray-900">Очистить базу</span>
                        <span className="ml-auto px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">ADMIN</span>
                    </div>
                    <p className="text-sm text-gray-700">
                        Доступна только администраторам. Удаляет все данные выбранного списка из базы данных. <strong>Необратимая операция!</strong>
                    </p>
                </div>
            </div>
        </>
    );
};
