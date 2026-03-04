import React from 'react';

// =====================================================================
// Секция: Счётчики в заголовке таблицы + Советы по использованию
// =====================================================================
export const CountersSection: React.FC = () => (
    <>
        {/* Счётчики */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Счётчики в заголовке таблицы</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            В шапке таблицы всегда видны три счётчика, которые показывают состояние базы промокодов:
        </p>

        <div className="not-prose my-6 flex gap-4 text-sm">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <span className="text-gray-500 block mb-1">Всего:</span>
                <span className="text-2xl font-bold text-gray-900">47</span>
            </div>
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <span className="text-green-600 block mb-1">Свободно:</span>
                <span className="text-2xl font-bold text-green-700">35</span>
            </div>
            <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                <span className="text-indigo-600 block mb-1">Выдано:</span>
                <span className="text-2xl font-bold text-indigo-700">12</span>
            </div>
        </div>

        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Зелёный счётчик "Свободно"</strong> — самый важный. Если он показывает 0, 
            розыгрыш невозможен — нужно срочно загрузить новую партию промокодов.
        </p>

        <hr className="!my-10" />

        {/* Когда использовать */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Когда использовать эту вкладку</h2>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">📦 Первичная загрузка</h3>
                <p className="text-sm text-purple-800">
                    Перед запуском конкурса загружаете всю партию промокодов разом. 
                    Рекомендуется загрузить минимум на 10-20 розыгрышей вперёд, чтобы не забывать догружать.
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">🔄 Догрузка при нехватке</h3>
                <p className="text-sm text-purple-800">
                    Если счётчик "Свободно" показывает мало кодов (меньше 5), самое время догрузить новую партию. 
                    Просто добавьте новые коды в форму и нажмите "Загрузить".
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">✏️ Редактирование описаний</h3>
                <p className="text-sm text-purple-800">
                    Если заказчик изменил описание приза, можете отредактировать его прямо в таблице. 
                    Наведите курсор на описание свободного промокода — появится иконка карандаша.
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">📊 Проверка запаса</h3>
                <p className="text-sm text-purple-800">
                    Перед выходными или праздниками проверяйте счётчик "Свободно". 
                    Если конкурс активный, промокоды расходуются автоматически — можете не заметить, что они закончились.
                </p>
            </div>
        </div>

        <div className="not-prose bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
            <p className="text-sm text-yellow-900">
                <strong>⚠️ Важно:</strong> Если счётчик "Свободно" показывает 0, система НЕ проведёт розыгрыш. 
                Она пропустит этот цикл и попробует снова в следующий раз. Поэтому следите за запасом промокодов!
            </p>
        </div>

        <hr className="!my-10" />
    </>
);
