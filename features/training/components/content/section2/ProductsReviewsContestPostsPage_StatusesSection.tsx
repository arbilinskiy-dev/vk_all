import React from 'react';
import { StatusBadge } from './ProductsReviewsContestPostsPage_Mocks';

// =====================================================================
// Секция «Статусы участников» — описание всех badge-статусов
// =====================================================================

export const StatusesSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Статусы участников</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Каждый участник имеет цветной badge статуса, который показывает его текущее состояние в конкурсе:
        </p>

        <div className="!not-prose space-y-4 !my-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <StatusBadge status="new" />
                <div>
                    <p className="font-semibold text-gray-800">Новый</p>
                    <p className="text-sm text-gray-600">Пост найден системой, но номер еще не присвоен. Требуется комментирование.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <StatusBadge status="processing" />
                <div>
                    <p className="font-semibold text-gray-800">В работе</p>
                    <p className="text-sm text-gray-600">Система в данный момент обрабатывает заявку (присваивает номер, комментирует пост). Badge мигает.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <StatusBadge status="commented" />
                <div>
                    <p className="font-semibold text-gray-800">Принят</p>
                    <p className="text-sm text-gray-600">Участнику присвоен номер, комментарий оставлен. Готов к участию в розыгрыше.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <StatusBadge status="error" />
                <div>
                    <p className="font-semibold text-gray-800">Ошибка</p>
                    <p className="text-sm text-gray-600">Не удалось прокомментировать пост (возможно, пост удален или закрыты комментарии). Под badge появляется текст "Ошибка VK".</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <StatusBadge status="winner" />
                <div>
                    <p className="font-semibold text-gray-800">Победитель</p>
                    <p className="text-sm text-gray-600">Этот участник выиграл в текущем розыгрыше. Badge выделен жирным шрифтом.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <StatusBadge status="used" />
                <div>
                    <p className="font-semibold text-gray-800">Использован</p>
                    <p className="text-sm text-gray-600">Участник выигрывал в прошлых розыгрышах. Не участвует в текущем конкурсе (архивная запись).</p>
                </div>
            </div>
        </div>
    </section>
);
