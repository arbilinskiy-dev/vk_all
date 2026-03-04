// =====================================================================
// ХАБ: Страница «Участники конкурса отзывов товаров» (центр обучения)
// Логика вынесена в подфайлы ProductsReviewsContestParticipantsPage_*
// =====================================================================
import React, { useState } from 'react';
import { ContentProps, Sandbox, NavigationButtons } from '../shared';
import { ParticipantsTableMock } from './ReviewsContestMocks';

// --- Подмодули ---
import { MOCK_PARTICIPANTS } from './ProductsReviewsContestParticipantsPage_data';
import { ActionButtonsDemo } from './ProductsReviewsContestParticipantsPage_ActionButtonsDemo';
import { StatusesDemo } from './ProductsReviewsContestParticipantsPage_StatusesDemo';
import { BeforeAfterSection } from './ProductsReviewsContestParticipantsPage_BeforeAfterSection';
import { TableStructureSection } from './ProductsReviewsContestParticipantsPage_TableStructureSection';
import { ActionButtonsTableSection } from './ProductsReviewsContestParticipantsPage_ActionButtonsTable';
import { RelatedSections } from './ProductsReviewsContestParticipantsPage_RelatedSections';
import { TipsSection } from './ProductsReviewsContestParticipantsPage_TipsSection';

// =====================================================================
// Основной компонент страницы
// =====================================================================
export const ProductsReviewsContestParticipantsPage: React.FC<ContentProps> = ({ title }) => {
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredParticipants = filterStatus === 'all' 
        ? MOCK_PARTICIPANTS 
        : MOCK_PARTICIPANTS.filter(p => p.status === filterStatus);

    return (
        <article className="prose prose-slate max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* ВВЕДЕНИЕ */}
            <p className="!text-lg !leading-relaxed !text-gray-600">
                Раздел <strong>"Участники"</strong> — это центральное место, где собираются все посты с ключевым словом конкурса (например, <code>#отзыв</code>). Здесь вы можете видеть каждого участника, его статус обработки, присвоенный номер и управлять процессом конкурса.
            </p>
            <p>
                <strong>Зачем нужен этот раздел?</strong> Раньше приходилось вручную искать посты в предложке, записывать авторов в таблицу Excel, присваивать номера и комментировать каждого вручную. Теперь система делает всё автоматически — находит участников, комментирует, присваивает номера и даже выбирает победителя с учётом черного списка.
            </p>

            {/* БЫЛО / СТАЛО */}
            <BeforeAfterSection />

            {/* СТРУКТУРА ТАБЛИЦЫ */}
            <TableStructureSection />

            {/* СТАТУСЫ УЧАСТНИКОВ */}
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">
                🎨 Статусы участников (6 вариантов)
            </h2>
            <p>
                Каждый участник проходит через несколько стадий обработки. Система отображает текущее состояние с помощью цветных бейджей:
            </p>
            <div className="not-prose"><StatusesDemo /></div>
            <div className="not-prose my-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Подсказка:</strong> Статус <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">processing</code> мигает (animate-pulse), чтобы показать что система работает. Если статус застрял в этом состоянии — возможно, ошибка API VK.
                    </p>
                </div>
            </div>

            {/* КНОПКИ ДЕЙСТВИЙ */}
            <ActionButtonsTableSection />

            {/* ПЕСОЧНИЦА 1: КНОПКИ */}
            <Sandbox
                title="🎮 Интерактивно: Попробуйте кнопки"
                description="Нажмите на любую кнопку, чтобы увидеть как они работают. Обратите внимание на иконки и состояние загрузки."
                instructions={[
                    '<strong>Кнопка "Собрать посты"</strong> (синяя) — находит новые отзывы',
                    '<strong>Кнопка "Прокомментировать"</strong> (зелёная) — присваивает номера',
                    '<strong>Кнопка "Подвести итоги"</strong> (янтарная) — выбирает победителя',
                    '<strong>Иконка "Обновить"</strong> вращается при загрузке'
                ]}
            >
                <ActionButtonsDemo />
            </Sandbox>

            {/* ПЕСОЧНИЦА 2: ТАБЛИЦА С ФИЛЬТРАМИ */}
            <Sandbox
                title="📊 Интерактивно: Таблица с фильтрами"
                description="Выберите статус, чтобы отфильтровать участников. Обратите внимание на аватары, номера и цветные бейджи."
                instructions={[
                    'Фильтр по статусу работает мгновенно',
                    'Аватары загружаются из профилей VK',
                    'Номера присваиваются только после комментирования',
                    'Кликните на имя, чтобы открыть профиль (в реальной системе)'
                ]}
            >
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Фильтр по статусу:</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                        <option value="all">Все участники ({MOCK_PARTICIPANTS.length})</option>
                        <option value="new">Только новые</option>
                        <option value="processing">В работе</option>
                        <option value="commented">Принятые</option>
                        <option value="error">С ошибками</option>
                        <option value="winner">Победители</option>
                        <option value="used">Использованные</option>
                    </select>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <p className="text-sm text-gray-600">Найдено участников: <strong className="text-gray-800">{filteredParticipants.length}</strong></p>
                    </div>
                    <ParticipantsTableMock data={filteredParticipants} />
                </div>
            </Sandbox>

            {/* СВЯЗЬ С ДРУГИМИ РАЗДЕЛАМИ */}
            <RelatedSections />

            {/* СОВЕТЫ ПО РАБОТЕ */}
            <TipsSection />

            {/* ЗАКЛЮЧЕНИЕ */}
            <hr className="!my-10" />
            <p className="!text-base !leading-relaxed !text-gray-600">
                Раздел "Участники" — это сердце автоматизации конкурса. Вместо ручной работы с Excel и комментариями теперь достаточно трёх кликов: <strong>Собрать → Прокомментировать → Подвести итоги</strong>. Система сама найдёт участников, присвоит номера, исключит черный список и выберет победителя.
            </p>
            <div className="not-prose my-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-green-900 mb-2">🎉 Готово к работе!</h4>
                    <p className="text-sm text-green-800">
                        Теперь вы знаете как управлять участниками конкурса. Переходите к следующим разделам, чтобы узнать про победителей, промокоды и рассылку призов.
                    </p>
                </div>
            </div>

            {/* НАВИГАЦИЯ */}
            <NavigationButtons currentPath="2-4-2-3-participants" />
        </article>
    );
};
