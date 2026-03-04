import React from 'react';

// =====================================================================
// Секция «Введение» + «Для кого» + «Было / Стало»
// =====================================================================
export const IntroSection: React.FC = () => (
    <>
        {/* ===== ВВЕДЕНИЕ ===== */}
        <section>
            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>Конкурс отзывов</strong> — это автоматизация розыгрышей призов среди пользователей, которые оставили отзывы на товары сообщества. Система сама находит участников, проверяет их на соответствие условиям, выбирает победителей и отправляет им уведомления.
            </p>

            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-8">
                Для кого эта автоматизация?
            </h2>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Для SMM-специалистов:</strong> управление конкурсами без ручной работы</li>
                <li><strong>Для руководителей:</strong> контроль вовлечённости и истории розыгрышей</li>
                <li><strong>Для сообществ с товарами:</strong> стимулирование пользователей оставлять отзывы</li>
            </ul>
        </section>

        <hr className="!my-10" />

        {/* ===== БЫЛО/СТАЛО ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Было / Стало
            </h2>

            <div className="not-prose grid md:grid-cols-2 gap-6 mt-6">
                {/* БЫЛО */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-red-800 mb-4">❌ Раньше (вручную)</h3>
                    <ul className="space-y-3 text-sm text-red-900">
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Заходить в каждый товар сообщества и вручную искать новые отзывы</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Вести списки участников в таблицах Excel или Google Sheets</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Вручную проверять каждого на черный список и повторное участие</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Проводить розыгрыш через сторонние сервисы или random.org</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Копировать тексты, вручную отправлять сообщения победителям</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Терять время на рутину вместо создания контента</span>
                        </li>
                    </ul>
                </div>

                {/* СТАЛО */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-800 mb-4">✅ Сейчас (автоматически)</h3>
                    <ul className="space-y-3 text-sm text-green-900">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Система сама находит новые отзывы по ключевым словам из товаров</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Автоматическая проверка на черный список и повторное участие</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Выбор победителей по условиям (количество или дата окончания)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Автоматическая отправка уведомлений победителям и комментариев к отзывам</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>История розыгрышей с отслеживанием выдачи призов</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Настроили один раз — работает постоянно</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </>
);
