/**
 * Секция «Промокоды» страницы обучения «Конкурс отзывов».
 * Содержит формат CSV, статусы промокодов и важные замечания.
 */
import React from 'react';

export const PromoCodesSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Вкладка "Промокоды"</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Управление базой промокодов для розыгрышей. Промокоды загружаются через CSV-файл и автоматически 
            выдаются победителям.
        </p>

        {/* Формат CSV-файла */}
        <div className="not-prose my-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-green-900 mb-2">📁 Формат CSV-файла:</p>
            <pre className="bg-white rounded p-3 text-xs font-mono text-gray-800 overflow-x-auto border border-green-200">
code,description{'\n'}
WIN_X7Z,Сет роллов "Филадельфия"{'\n'}
WIN_A3B,Пицца "Маргарита"{'\n'}
WIN_C9D,Бургер "Классик"
            </pre>
            <p className="text-xs text-gray-600 mt-2">
                <strong>code</strong> — уникальный промокод (обязательно)<br />
                <strong>description</strong> — описание приза (опционально)
            </p>
        </div>

        {/* Статусы промокодов */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Статусы промокодов</h3>
        <div className="not-prose my-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="font-semibold text-gray-800">Свободен</span>
                    </div>
                    <p className="text-sm text-gray-600">Промокод доступен для выдачи победителю</p>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                        <span className="font-semibold text-gray-800">Выдан</span>
                    </div>
                    <p className="text-sm text-gray-600">Промокод уже отправлен победителю</p>
                </div>
            </div>
        </div>

        {/* Важные замечания */}
        <div className="not-prose my-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Важно:</p>
            <ul className="space-y-1 text-sm text-gray-700">
                <li>• Следите за количеством свободных промокодов — если они закончатся, победитель не получит приз</li>
                <li>• Промокоды, отмеченные как "Выдан", нельзя использовать повторно</li>
                <li>• Администраторы могут очистить всю базу промокодов (удаляются ВСЕ, включая выданные)</li>
            </ul>
        </div>
    </section>
);
