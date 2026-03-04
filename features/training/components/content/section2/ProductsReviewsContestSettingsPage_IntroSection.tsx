/**
 * Секция «Введение» и «Было / Стало» для страницы настроек конкурса отзывов.
 *
 * Описывает назначение вкладки «Настройки» и визуально сравнивает
 * ручной и автоматизированный подход.
 */
import React from 'react';

// =====================================================================
// Вводная часть: что настраивается на вкладке
// =====================================================================
export const IntroSection: React.FC = () => (
    <>
        {/* ===== ВВЕДЕНИЕ ===== */}
        <section>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Вкладка <strong>"Настройки"</strong> — это центр управления конкурсом отзывов. Здесь настраивается всё: от активности механики и ключевых слов до шаблонов сообщений участникам и победителям. Правильная настройка этих параметров гарантирует, что конкурс будет работать автоматически и без ошибок.
            </p>

            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-8">
                Что настраивается на этой вкладке?
            </h2>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Активность конкурса</strong> — включить или остановить сбор участников</li>
                <li><strong>Ключевые слова</strong> — по каким словам искать отзывы в товарах сообщества</li>
                <li><strong>Условия завершения</strong> — когда подводить итоги (по количеству, по дате или смешанный режим)</li>
                <li><strong>Шаблоны сообщений</strong> — что отправлять участникам, победителям и в посте с итогами</li>
                <li><strong>Автоматический черный список</strong> — исключать ли победителей из будущих розыгрышей</li>
            </ul>
        </section>

        <hr className="!my-10" />

        {/* ===== БЫЛО / СТАЛО ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Было / Стало
            </h2>

            <div className="not-prose grid md:grid-cols-2 gap-6 mt-6">
                {/* БЫЛО */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-red-800 mb-4">❌ Раньше (ручная работа)</h3>
                    <ul className="space-y-3 text-sm text-red-900">
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Каждый раз вручную копировать текст комментария для регистрации участников</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Забывать добавить хештег или номер участника — приходилось редактировать</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Составлять пост с итогами вручную, форматировать список победителей</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Не было единого шаблона — каждый раз писать текст заново</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>Если победитель уже выигрывал, узнавали только постфактум</span>
                        </li>
                    </ul>
                </div>

                {/* СТАЛО */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-800 mb-4">✅ Сейчас (автоматика)</h3>
                    <ul className="space-y-3 text-sm text-green-900">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Один раз настроили шаблоны — используются всегда</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Переменные автоматически подставляются (номер участника, промокод, имя)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Пост с итогами формируется автоматически по шаблону</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Условия завершения настраиваются гибко (день недели, количество, комбинация)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>Автоматический бан победителя на N дней — исключает повторные выигрыши</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </>
);
