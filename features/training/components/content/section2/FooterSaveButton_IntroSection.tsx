import React from 'react';

// =====================================================================
// Секция 1: Введение — зачем нужен футер в модальных окнах
// =====================================================================

export const IntroSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Зачем нужен футер в модальных окнах?
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Футер (нижняя часть всплывающего окна) — это место, где находятся главные кнопки действий: <strong>«Сохранить»</strong>, <strong>«Создать»</strong>, <strong>«Отмена»</strong>. Он всегда на виду, даже когда форма длинная и нужно прокручивать содержимое окна.
        </p>
        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Почему именно внизу?</strong> Потому что при заполнении формы взгляд движется сверху вниз — прочитали заголовок, заполнили поля, и вот внизу кнопки для завершения действия. Это естественный порядок работы.
        </p>

        <div className="not-prose bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-4 rounded-md my-6">
            <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-semibold text-indigo-900 text-sm">Единообразие интерфейса</p>
                    <p className="text-sm text-indigo-800 mt-1">
                        Во всех модальных окнах приложения футер выглядит одинаково — светло-серый фон, кнопки справа, отступы и цвета стандартные. Это помогает быстро ориентироваться: пользователь всегда знает, где искать кнопку сохранения.
                    </p>
                </div>
            </div>
        </div>
    </section>
);
