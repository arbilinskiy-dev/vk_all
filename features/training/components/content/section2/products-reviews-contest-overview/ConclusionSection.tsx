import React from 'react';
import { NavigationButtons } from '../../shared';

// =====================================================================
// Секция «Заключение» + навигация
// =====================================================================
export const ConclusionSection: React.FC = () => (
    <>
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Что дальше?
            </h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Теперь, когда вы знакомы с общей структурой конкурса отзывов, переходите к детальным разделам для изучения каждой вкладки и настройки конкурса под ваши задачи.
            </p>

            <div className="not-prose mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Совет</h3>
                <p className="text-sm text-blue-800">
                    Начните с настройки базовых параметров: включите конкурс, укажите ключевые слова и установите условие завершения. Затем настройте шаблоны сообщений и проведите первый тестовый розыгрыш на небольшом количестве участников.
                </p>
            </div>
        </section>

        {/* ===== НАВИГАЦИЯ ===== */}
        <NavigationButtons currentPath="2-4-2-1-overview" />
    </>
);
