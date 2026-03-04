import React from 'react';
import { Sandbox } from '../shared';
import { MockPostsTable, MOCK_CONTEST_ENTRIES } from './ProductsReviewsContestPostsPage_Mocks';

// =====================================================================
// Секция «Структура таблицы» + Sandbox 1 (таблица участников)
// =====================================================================

export const TableStructureSection: React.FC = () => (
    <>
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как устроена таблица участников</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Таблица содержит семь колонок с полной информацией о каждом участнике:
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">1. Номер участника (№)</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Уникальный номер, присвоенный участнику при комментировании. Если номер еще не присвоен — отображается прочерк (-).
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">2. Фото</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Аватар пользователя из VK. Если фото не загружено — показывается серый круг.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">3. Автор</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Имя пользователя и кликабельная ссылка на его профиль VK. Ссылка открывается в новой вкладке.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">4. Текст поста</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Первые несколько слов из поста участника. Если навести курсор — появится всплывающая подсказка с полным текстом.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">5. Статус</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Цветной badge, показывающий текущее состояние заявки. Подробнее о статусах — ниже в разделе "Статусы участников".
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">6. Дата</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Когда пост был найден системой (формат <code>ДД.ММ.ГГГГ</code>).
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">7. Действия</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Иконка внешней ссылки — при клике открывается оригинальный пост участника на стене ВКонтакте.
            </p>
        </section>

        {/* Sandbox 1: Таблица участников */}
        <Sandbox
            title="📋 Таблица участников конкурса"
            description="Пример таблицы с разными статусами участников. Обратите внимание на цветные badges статусов."
            instructions={[
                '<strong>Наведите</strong> курсор на строку — она подсветится',
                '<strong>Кликните</strong> на имя участника — откроется его профиль VK (имитация)',
                '<strong>Наведите</strong> на текст поста — увидите всплывающую подсказку',
                '<strong>Кликните</strong> на иконку внешней ссылки — откроется пост VK'
            ]}
        >
            <MockPostsTable entries={MOCK_CONTEST_ENTRIES} />
        </Sandbox>
    </>
);
