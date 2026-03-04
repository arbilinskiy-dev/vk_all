import React from 'react';

/**
 * Секция «Частые вопросы» — FAQ по настройкам промо-дропа.
 */
export const PromoDropSettingsPage_FAQSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Частые вопросы
        </h2>

        <div className="not-prose space-y-6 my-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                    1. Когда появится функционал дропа промокодов?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    Точная дата релиза пока не определена. Функционал находится на этапе планирования. 
                    О готовности будет объявлено в обновлениях приложения. Следите за новостями или используйте альтернативные инструменты 
                    (конкурс отзывов, универсальные конкурсы).
                </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                    2. Можно ли сейчас провести дроп промокодов вручную?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Да, технически возможно, но потребуется:
                </p>
                <ul className="text-sm text-gray-700 space-y-1.5">
                    <li className="flex gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>Постоянно обновлять страницу с постом и следить за комментариями</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>Вручную запоминать первых N участников с ключевым словом</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>Отправлять промокоды каждому в личные сообщения</span>
                    </li>
                </ul>
                <p className="text-sm text-gray-700 leading-relaxed mt-3">
                    Это отнимает 1-2 часа времени и повышает риск ошибки. Автоматизация сократит это до 5 минут на настройку.
                </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                    3. Будет ли работать защита от ботов?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    Да, планируется интеграция с чёрным списком и фильтрами (возраст аккаунта, подписка на сообщество). 
                    Это те же механизмы, что используются в конкурсе отзывов — они уже доказали свою эффективность.
                </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                    4. Можно ли будет запустить несколько дропов одновременно?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    Это будет зависеть от реализации. Скорее всего, можно будет настроить несколько дропов для разных проектов, 
                    но в рамках одного проекта активен будет только один дроп. Детали уточнятся при разработке.
                </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                    5. Нужно ли будет следить за дропом или всё произойдёт автоматически?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    Полностью автоматически. Вы настраиваете параметры, запускаете дроп — и система сама мониторит комментарии, 
                    выбирает первых N участников и отправляет им промокоды в ЛС. 
                    Вы получите уведомление, когда все призы будут розданы.
                </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                    6. Что если промокоды закончатся раньше времени?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    Дроп автоматически остановится, когда закончатся промокоды. 
                    Опоздавшим участникам (если настроено) будет отправлено сообщение о том, что призы уже разобрали. 
                    Вы увидите это в журнале отправок.
                </p>
            </div>
        </div>
    </section>
);
