import React from 'react';

/**
 * Секция «Было / Стало» — сравнение ручной работы
 * и автоматизации дропа промокодов.
 */
export const PromoDropSettingsPage_BeforeAfterSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Было / Стало
        </h2>

        <div className="not-prose grid md:grid-cols-2 gap-6 my-6">
            {/* Было */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-red-900">Было (ручная работа)</h3>
                </div>
                <ul className="space-y-3 text-sm text-red-800">
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Постоянно обновлять страницу с постом, чтобы видеть новые комментарии</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Вручную искать комментарии с ключевым словом и запоминать имена</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Вручную отправлять промокоды каждому победителю в личные сообщения</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Риск ошибки: отправить код дважды одному человеку или пропустить кого-то</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Невозможно проводить дроп ночью — нужно быть онлайн</span>
                    </li>
                </ul>
            </div>

            {/* Стало */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-green-900">Стало (автоматизация)</h3>
                </div>
                <ul className="space-y-3 text-sm text-green-800">
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>Система сама мониторит комментарии в режиме реального времени</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>Автоматически находит первых N человек с ключевым словом</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>Сама отправляет промокоды в ЛС победителям с персональным сообщением</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>Защита от дубликатов: один человек = один промокод</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>Работает 24/7, можно запустить дроп в любое время</span>
                    </li>
                </ul>
            </div>
        </div>

        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Экономия времени:</strong> Вместо 1-2 часов ручного мониторинга и рассылки — 5 минут на настройку и 0 минут на контроль. 
            Система всё делает сама.
        </p>
    </section>
);
