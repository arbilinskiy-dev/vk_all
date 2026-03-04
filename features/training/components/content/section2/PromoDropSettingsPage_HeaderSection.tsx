import React from 'react';

/**
 * Секция заголовка страницы настроек промо-дропа:
 * — Заголовок (h1)
 * — Баннер «Раздел в разработке»
 * — Вводный блок «Что это за страница?»
 */

interface HeaderSectionProps {
    /** Заголовок страницы, пробрасывается из ContentProps */
    title: string;
}

export const PromoDropSettingsPage_HeaderSection: React.FC<HeaderSectionProps> = ({ title }) => (
    <>
        <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
            {title}
        </h1>

        {/* Уведомление о разработке */}
        <div className="not-prose mb-8">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                <div className="flex items-start gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-bold text-amber-900 mb-2">Раздел в разработке</h3>
                        <p className="text-sm text-amber-800 leading-relaxed">
                            Функционал "Дроп промокодов" находится на этапе планирования. Эта страница описывает, 
                            какие настройки появятся, когда автоматизация будет реализована.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Введение */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Что это за страница?
            </h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Страница настроек дропа промокодов — это место, где вы будете задавать правила конкурса: 
                где искать комментарии, какое ключевое слово использовать, сколько промокодов раздать и как защитить конкурс от накруток.
            </p>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Настройка дропа занимает 3-5 минут. После сохранения система начинает автоматически отслеживать комментарии 
                и раздавать промокоды первым участникам.
            </p>
        </section>
    </>
);
