// =====================================================================
// Секция «Связь с другими разделами» — интеграция участников с остальным конкурсом
// =====================================================================
import React from 'react';

export const RelatedSections: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">
            🔗 Связь с другими разделами
        </h2>

        <p>
            Раздел "Участники" тесно интегрирован с другими частями конкурса:
        </p>

        <div className="not-prose">
            <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-white border-l-4 border-indigo-500 p-4 rounded-r-lg shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-2">⚙️ Настройки конкурса</h4>
                    <p className="text-sm text-gray-600">Ключевое слово (например, <code>#отзыв</code>) определяет каких участников собирать. Дата начала — с какого момента учитывать посты.</p>
                </div>

                <div className="bg-white border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-2">🚫 Чёрный список</h4>
                    <p className="text-sm text-gray-600">При подведении итогов система автоматически исключает участников из ЧС. Победителем может стать только "чистый" участник.</p>
                </div>

                <div className="bg-white border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-2">🎟️ Промокоды</h4>
                    <p className="text-sm text-gray-600">Победитель автоматически получает свободный промокод. Система отправляет его в личные сообщения или пишет в комментарий.</p>
                </div>

                <div className="bg-white border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-2">🏆 Победители</h4>
                    <p className="text-sm text-gray-600">История всех розыгрышей сохраняется. Участники со статусом "Победитель" или "Использован" не могут выиграть повторно.</p>
                </div>
            </div>
        </div>
    </>
);
