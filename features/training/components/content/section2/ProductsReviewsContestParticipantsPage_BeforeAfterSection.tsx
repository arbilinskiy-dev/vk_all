// =====================================================================
// Секция «Было / Стало» — сравнение ручной работы и автоматизации
// =====================================================================
import React from 'react';

export const BeforeAfterSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">
            ❌ Было → ✅ Стало
        </h2>

        <div className="not-prose">
            <div className="grid md:grid-cols-2 gap-6 my-6">
                {/* БЫЛО */}
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg">
                    <h3 className="text-lg font-bold text-red-900 mb-3">❌ Было (ручная работа)</h3>
                    <ul className="space-y-2 text-sm text-red-800">
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Заходить в каждое сообщество ВКонтакте отдельно</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Вручную искать посты с хештегом в предложке</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Записывать участников в Excel-таблицу</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Комментировать каждый пост вручную с номером</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Проверять черный список на бумажке</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Выбирать победителя через random.org</span>
                        </li>
                    </ul>
                </div>

                {/* СТАЛО */}
                <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                    <h3 className="text-lg font-bold text-green-900 mb-3">✅ Стало (автоматизация)</h3>
                    <ul className="space-y-2 text-sm text-green-800">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Одна кнопка</strong> "Собрать посты" — находит всех участников</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Таблица с аватарами</strong> — видно кто участвует</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Автокомментирование</strong> — кнопка присваивает номера всем</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Статусы в реальном времени</strong> — видно кто обработан</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Автоматическая фильтрация</strong> — черный список учитывается</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Кнопка "Подвести итоги"</strong> — случайный выбор победителя</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </>
);
