import React from 'react';

/**
 * Секция «Что использовать прямо сейчас?» —
 * существующие альтернативы: конкурс отзывов, универсальные конкурсы.
 */
export const PromoDropSettingsPage_AlternativesSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Что использовать прямо сейчас?
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Пока дроп промокодов в разработке, вы можете решить похожие задачи с помощью существующих инструментов:
        </p>

        <div className="not-prose my-6 space-y-4">
            {/* Конкурс отзывов */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-900 mb-2">
                            Конкурс отзывов
                        </h3>
                        <p className="text-sm text-green-800 mb-4 leading-relaxed">
                            Автоматическая раздача промокодов участникам конкурса. Можно настроить ключевое слово, количество призов, 
                            фильтры участников и автоматическую отправку кодов в ЛС.
                        </p>
                        <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                                <p className="font-semibold text-green-900 mb-2">✅ Что можно:</p>
                                <ul className="text-green-800 space-y-1">
                                    <li>• База промокодов</li>
                                    <li>• Автоотправка в ЛС</li>
                                    <li>• Черный список</li>
                                    <li>• Фильтры участников</li>
                                    <li>• Логи отправок</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-green-900 mb-2">❌ Чего нет:</p>
                                <ul className="text-green-800 space-y-1">
                                    <li>• Режима "кто первый"</li>
                                    <li>• Мониторинга в реальном времени</li>
                                    <li>• Гонки за скорость</li>
                                </ul>
                            </div>
                        </div>
                        <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 hover:underline">
                            Перейти в раздел "Конкурс отзывов"
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            {/* Универсальные конкурсы */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-purple-900 mb-2">
                            Универсальные конкурсы
                        </h3>
                        <p className="text-sm text-purple-800 mb-4 leading-relaxed">
                            Гибкий инструмент для создания любых типов конкурсов с промокодами. 
                            Позволяет настроить условия участия, автоматический выбор победителей и рассылку призов.
                        </p>
                        <p className="text-sm text-purple-700 font-medium">
                            Больше возможностей для кастомизации, но требует больше времени на настройку.
                        </p>
                        <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-800 hover:underline mt-4">
                            Перейти в раздел "Универсальные конкурсы"
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
