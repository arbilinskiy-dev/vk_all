/**
 * ProductsReviewsContestBlacklistPage — ХАБ-файл.
 * Страница центра обучения: чёрный список конкурса отзывов товаров.
 *
 * Логика и контент вынесены в подфайлы:
 *   - ProductsReviewsContestBlacklistPage_MockTable   — таблица ЧС (mock)
 *   - ProductsReviewsContestBlacklistPage_MockModal   — модальное окно добавления (mock)
 *   - ProductsReviewsContestBlacklistPage_Sections    — 7 текстовых секций
 */
import React, { useState } from 'react';
import { ContentProps, Sandbox, NavigationButtons } from '../shared';
import { MockBlacklistTable, type MockBlacklistEntry } from './ProductsReviewsContestBlacklistPage_MockTable';
import { MockAddBlacklistModal } from './ProductsReviewsContestBlacklistPage_MockModal';
import {
    IntroSection,
    BeforeAfterSection,
    TableStructureSection,
    BlockModesSection,
    EmptyStateSection,
    TipsSection,
    FaqSection,
} from './ProductsReviewsContestBlacklistPage_Sections';

// =====================================================================
// ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ (ХАБ)
// =====================================================================

export const ProductsReviewsContestBlacklistPage: React.FC<ContentProps> = ({ title }) => {
    // Тестовые данные для Sandbox 1
    const [sandbox1Entries] = useState<MockBlacklistEntry[]>([
        { id: '1', user_name: 'Иван Петров', user_vk_id: 123456, user_screen_name: 'ivan_petrov', until_date: '2026-03-15', created_at: '2026-02-01T10:30:00' },
        { id: '2', user_name: 'Мария Сидорова', user_vk_id: 789012, user_screen_name: 'maria_sidorova', until_date: '2026-01-10', created_at: '2025-12-20T14:20:00' },
        { id: '3', user_name: 'Алексей Смирнов', user_vk_id: 345678, user_screen_name: 'alex_smirnov', until_date: null, created_at: '2026-01-15T09:15:00' },
    ]);

    // Sandbox 2: модальное окно
    const [showModal, setShowModal] = useState(false);

    // Sandbox 3: пустая таблица
    const [sandbox3Entries] = useState<MockBlacklistEntry[]>([]);

    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            {/* Секция 1: Введение */}
            <IntroSection />
            <hr className="!my-10" />

            {/* Секция 2: Было / Стало */}
            <BeforeAfterSection />
            <hr className="!my-10" />

            {/* Секция 3: Структура таблицы */}
            <TableStructureSection />

            {/* Sandbox 1: Таблица с данными */}
            <Sandbox
                title="📊 Интерактивная таблица черного списка"
                description="Пример таблицы с тремя записями: активная блокировка до даты, истекший срок, и бессрочная блокировка."
                instructions={[
                    '<strong>Наведите</strong> курсор на строку — она подсветится',
                    '<strong>Обратите внимание</strong> на вторую запись (Мария Сидорова) — срок блокировки истек, строка серая с меткой "Истек"',
                    '<strong>Кликните</strong> на синюю ссылку профиля — откроется VK (имитация)',
                    '<strong>Кликните</strong> на иконку корзины — появится уведомление об удалении',
                ]}
            >
                <MockBlacklistTable entries={sandbox1Entries} />
            </Sandbox>
            <hr className="!my-10" />

            {/* Секция 4: Режимы блокировки */}
            <BlockModesSection />

            {/* Sandbox 2: Модальное окно */}
            <Sandbox
                title="➕ Окно добавления в черный список"
                description="Демонстрация модального окна с полями ввода и выбором режима блокировки."
                instructions={[
                    '<strong>Кликните</strong> на кнопку "Открыть окно добавления"',
                    '<strong>Введите</strong> несколько ссылок на профили VK (по одной на строку)',
                    '<strong>Выберите</strong> режим блокировки: "Бессрочно" или "До определенной даты"',
                    '<strong>Если выбрали</strong> "До определенной даты" — появится поле выбора даты',
                    '<strong>Нажмите</strong> "Сохранить" — появится индикатор загрузки, затем окно закроется',
                ]}
            >
                <div className="space-y-4">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Открыть окно добавления
                    </button>
                    {showModal && <MockAddBlacklistModal onClose={() => setShowModal(false)} />}
                </div>
            </Sandbox>
            <hr className="!my-10" />

            {/* Секция 5: Пустое состояние */}
            <EmptyStateSection />

            {/* Sandbox 3: Пустая таблица */}
            <Sandbox
                title="🚫 Пустой черный список"
                description="Как выглядит таблица, когда в ней нет записей."
                instructions={['<strong>Это состояние</strong> показывает, что черный список пока не содержит заблокированных пользователей']}
            >
                <MockBlacklistTable entries={sandbox3Entries} />
            </Sandbox>
            <hr className="!my-10" />

            {/* Секция 6: Советы */}
            <TipsSection />
            <hr className="!my-10" />

            {/* Секция 7: FAQ */}
            <FaqSection />
            <hr className="!my-10" />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-2-7-blacklist" />
        </article>
    );
};
