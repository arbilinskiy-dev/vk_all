import React from 'react';
import { Sandbox, MockPrimarySidebar, MockPostCardSmall, MockProductCard, MockContestCard } from './AboutTrainingCenter_Mocks';
import { LearnCard, LegendItem } from './AboutTrainingCenter_Cards';

// =====================================================================
// Секции «Контентная часть» страницы «О Центре обучения»
// =====================================================================

// ---------------------------------------------------------------------
// Примеры из реального интерфейса — панель навигации + типы постов
// ---------------------------------------------------------------------
export const ExamplesSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">🖼️ Примеры из реального интерфейса</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Чтобы вы сразу понимали, как выглядят элементы в реальном приложении, 
            мы показываем <strong>mock-версии</strong> (упрощённые копии) реальных компонентов:
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Главная навигационная панель</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Это боковая панель слева, которая позволяет переключаться между основными разделами приложения.
        </p>

        <Sandbox 
            title="Главная навигация" 
            description="Кликайте на иконки, чтобы переключаться между разделами. Наведите курсор, чтобы увидеть подсказки."
        >
            <MockPrimarySidebar />
        </Sandbox>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Три типа постов</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В календаре вы увидите посты с разными рамками — каждая означает свой тип:
        </p>

        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div>
                <MockPostCardSmall type="system" time="10:00" />
                <p className="text-sm text-gray-600 mt-2 text-center">
                    <strong>Системный пост</strong> — создан в планировщике, ждёт отправки
                </p>
            </div>
            <div>
                <MockPostCardSmall type="vk" time="15:00" />
                <p className="text-sm text-gray-600 mt-2 text-center">
                    <strong>Отложка VK</strong> — уже в очереди VK
                </p>
            </div>
            <div>
                <MockPostCardSmall type="published" time="12:00" />
                <p className="text-sm text-gray-600 mt-2 text-center">
                    <strong>Опубликован</strong> — уже на стене сообщества
                </p>
            </div>
        </div>
    </>
);

// ---------------------------------------------------------------------
// Что вы узнаете — 4 карточки + примеры элементов (товар, конкурс)
// ---------------------------------------------------------------------
export const LearnSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">📚 Что вы узнаете</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Центр обучения охватывает все аспекты работы с приложением:
        </p>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <LearnCard 
                icon="📅"
                title="Управление контентом"
                description="Всё о создании, планировании и публикации постов"
                items={[
                    'Работа с календарём отложенных постов',
                    'Модерация предложенных постов',
                    'Использование AI для генерации текстов',
                    'Drag-and-Drop перемещение постов',
                ]}
            />
            <LearnCard 
                icon="🛍️"
                title="Работа с товарами"
                description="Массовое редактирование каталога VK"
                items={[
                    'Импорт/экспорт товаров (CSV, XLSX)',
                    'Массовое редактирование цен и описаний',
                    'AI-коррекция описаний',
                    'Управление категориями и альбомами',
                ]}
            />
            <LearnCard 
                icon="⚙️"
                title="Автоматизации и конкурсы"
                description="Настройка ботов и игровых механик"
                items={[
                    'Конкурсы отзывов с промокодами',
                    'Автопубликация постов в истории',
                    'Поздравления с днём рождения',
                    'AI-посты по расписанию',
                ]}
            />
            <LearnCard 
                icon="🔧"
                title="Администрирование"
                description="Управление системой и пользователями"
                items={[
                    'Настройка проектов и команд',
                    'Управление VK-токенами',
                    'Системные аккаунты и AI-токены',
                    'Просмотр логов и задач',
                ]}
            />
        </div>

        {/* Примеры элементов интерфейса */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Примеры элементов интерфейса</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Вот как выглядят некоторые элементы, с которыми вы будете работать:
        </p>

        <div className="not-prose flex flex-wrap gap-4 my-6 items-start">
            <MockProductCard />
            <MockContestCard />
        </div>
    </>
);

// ---------------------------------------------------------------------
// Условные обозначения — цвета, рамки, иконки
// ---------------------------------------------------------------------
export const LegendSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">🏷️ Условные обозначения</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В документации и интерфейсе используются единые обозначения:
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Цвета счётчиков</h3>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
            <LegendItem 
                icon={<span className="bg-gradient-to-t from-gray-300 to-red-200 text-red-900 text-xs px-2 py-1 rounded-full font-medium">0</span>}
                title="Красный: Нет контента"
                description="В проекте нет постов — пора за работу!"
            />
            <LegendItem 
                icon={<span className="bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 text-xs px-2 py-1 rounded-full font-medium">3</span>}
                title="Оранжевый: Мало (1-4)"
                description="Контент есть, но его немного"
            />
            <LegendItem 
                icon={<span className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">7</span>}
                title="Серый: Достаточно (5-10)"
                description="Хороший запас контента"
            />
            <LegendItem 
                icon={<span className="bg-gradient-to-t from-gray-300 to-green-200 text-green-900 text-xs px-2 py-1 rounded-full font-medium">15</span>}
                title="Зелёный: Много (11+)"
                description="Отлично! Контента достаточно"
            />
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Типы рамок постов</h3>
        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <LegendItem 
                icon={<div className="w-8 h-8 border-2 border-dashed border-indigo-400 rounded" />}
                title="Пунктирная"
                description="Системный пост (ещё не в VK)"
            />
            <LegendItem 
                icon={<div className="w-8 h-8 border-2 border-solid border-indigo-500 rounded" />}
                title="Сплошная"
                description="Отложенный пост VK"
            />
            <LegendItem 
                icon={<div className="w-8 h-8 border border-gray-300 bg-gray-50 rounded" />}
                title="Тонкая серая"
                description="Опубликованный пост"
            />
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Иконки действий</h3>
        <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <LegendItem icon={<span className="text-xl">✏️</span>} title="Редактировать" description="Открыть для изменения" />
            <LegendItem icon={<span className="text-xl">📋</span>} title="Копировать" description="Создать копию" />
            <LegendItem icon={<span className="text-xl">🗑️</span>} title="Удалить" description="Удалить элемент" />
            <LegendItem icon={<span className="text-xl">🔄</span>} title="Обновить" description="Синхронизировать с VK" />
        </div>
    </>
);

// ---------------------------------------------------------------------
// Быстрый старт — 3 сценария + совет
// ---------------------------------------------------------------------
export const QuickStartSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">🚀 Быстрый старт</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Готовы начать? Вот три простых сценария для первого знакомства:
        </p>

        <div className="not-prose space-y-4 my-6">
            <div className="bg-white border-l-4 border-indigo-500 rounded-r-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-sm px-2 py-0.5 rounded">Сценарий 1</span>
                    Создание первого поста
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                    Выберите проект → Кликните на пустой слот в календаре → Заполните текст и добавьте фото → Сохраните
                </p>
                <p className="text-xs text-indigo-600 mt-2">→ Перейти к разделу: 2.1.8. Операции с постами</p>
            </div>

            <div className="bg-white border-l-4 border-green-500 rounded-r-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 text-sm px-2 py-0.5 rounded">Сценарий 2</span>
                    Планирование на неделю
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                    Откройте календарь → Используйте режим "Неделя" → Drag-and-Drop для распределения постов → Копируйте удачные посты
                </p>
                <p className="text-xs text-green-600 mt-2">→ Перейти к разделу: 2.1.3. Сетка календаря</p>
            </div>

            <div className="bg-white border-l-4 border-purple-500 rounded-r-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 text-sm px-2 py-0.5 rounded">Сценарий 3</span>
                    Работа с предложенными постами
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                    Перейдите на вкладку "Предложенные" → Просмотрите посты от подписчиков → Отредактируйте с AI → Запланируйте публикацию
                </p>
                <p className="text-xs text-purple-600 mt-2">→ Перейти к разделу: 2.2. Вкладка "Предложенные"</p>
            </div>
        </div>
    </>
);

// ---------------------------------------------------------------------
// Заключительный совет
// ---------------------------------------------------------------------
export const TipSection: React.FC = () => (
    <div className="not-prose bg-gray-50 border rounded-xl p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 Совет</h3>
        <p className="text-gray-600">
            Не пытайтесь запомнить всё сразу! Используйте Центр обучения как справочник — 
            возвращайтесь к нужным разделам по мере необходимости. Оглавление слева всегда поможет 
            быстро найти нужную информацию.
        </p>
    </div>
);
