import React from 'react';

/**
 * Секция «Чем отличается от конкурса отзывов?» —
 * таблица сравнения конкурса отзывов и дропа промокодов.
 */
export const PromoDropSettingsPage_ComparisonTable: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Чем отличается от конкурса отзывов?
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            У нас уже есть "Конкурс отзывов" с похожими возможностями. В чём разница?
        </p>

        <div className="not-prose my-6">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Параметр</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Конкурс отзывов (есть сейчас)</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Дроп промокодов (планируется)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Принцип выбора победителя</td>
                            <td className="px-4 py-3 text-gray-700">Случайный выбор из всех подходящих</td>
                            <td className="px-4 py-3 text-gray-700"><strong className="text-indigo-600">Кто первый написал — тот победил</strong></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Скорость реакции</td>
                            <td className="px-4 py-3 text-gray-700">Не важна, можно написать в любое время</td>
                            <td className="px-4 py-3 text-gray-700"><strong className="text-indigo-600">Критична — нужно быть быстрее других</strong></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Проверки участников</td>
                            <td className="px-4 py-3 text-gray-700">Подписка, возраст аккаунта, чёрный список</td>
                            <td className="px-4 py-3 text-gray-700">Те же проверки, но упрощённые</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Вовлечённость</td>
                            <td className="px-4 py-3 text-gray-700">Средняя (можно подождать)</td>
                            <td className="px-4 py-3 text-gray-700"><strong className="text-indigo-600">Высокая (азарт, гонка)</strong></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Подходит для</td>
                            <td className="px-4 py-3 text-gray-700">Продуманные конкурсы с отзывами</td>
                            <td className="px-4 py-3 text-gray-700"><strong className="text-indigo-600">Быстрые акции, флешмобы</strong></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">Сложность настройки</td>
                            <td className="px-4 py-3 text-gray-700">Средняя (много параметров)</td>
                            <td className="px-4 py-3 text-gray-700"><strong className="text-indigo-600">Простая (минимум полей)</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Вывод:</strong> Конкурс отзывов — для спокойных длительных конкурсов. Дроп промокодов — для быстрых акций с ажиотажем.
        </p>
    </section>
);
