/**
 * Секция «Интерактивные песочницы» — демо селектора категорий + кнопки обновления.
 *
 * Управляет собственным состоянием для mock-взаимодействий.
 */
import React, { useState } from 'react';
import { Sandbox } from '../shared';
import {
    CategorySelectorMock,
    RefreshCategoriesButtonMock,
    MockCategory,
} from './ProductsCategoryFiltersPage_MockComponents';

export const SandboxSection: React.FC = () => {
    // Состояние для demo — селектор категорий
    const [selectedCategory, setSelectedCategory] = useState<MockCategory | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Состояние для demo — кнопка обновления
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            alert('Категории обновлены из VK');
        }, 2000);
    };

    return (
        <>
            {/* ============================================ */}
            {/* Песочница: выбор категории */}
            {/* ============================================ */}
            <section>
                <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                    🎮 Интерактивная демонстрация
                </h2>
                <p className="!text-base !leading-relaxed !text-gray-700">
                    Попробуйте открыть селектор, поискать категорию и выбрать её:
                </p>

                <Sandbox
                    title="Выбор категории товара"
                    description="Кликните по кнопке, используйте поиск, выберите категорию из списка."
                    instructions={[
                        'Нажмите на кнопку <strong>"Выберите категорию"</strong>',
                        'Введите в поиск <strong>"футбол"</strong> — список отфильтруется',
                        'Наведите курсор на категорию — она подсветится голубым',
                        'Кликните на категорию — она выберется и отобразится в кнопке',
                        'Обратите внимание на <strong>двухстрочное отображение</strong> выбранной категории',
                    ]}
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Категория товара:
                            </p>
                            <CategorySelectorMock
                                value={selectedCategory}
                                isOpen={isDropdownOpen}
                                onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                                onSelect={setSelectedCategory}
                            />
                        </div>

                        {selectedCategory && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm text-green-900">
                                    <strong>Выбрано:</strong> {selectedCategory.name}
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                    ID: {selectedCategory.id} | Раздел: {selectedCategory.section_name}
                                </p>
                            </div>
                        )}
                    </div>
                </Sandbox>
            </section>

            <hr className="!my-10" />

            {/* ============================================ */}
            {/* Песочница: кнопка обновления */}
            {/* ============================================ */}
            <section>
                <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                    🔄 Обновление категорий из VK
                </h2>
                <p className="!text-base !leading-relaxed !text-gray-700">
                    В шапке страницы "Товары" есть кнопка с иконкой круговой стрелки. Она загружает
                    актуальный справочник категорий из VK.
                </p>

                <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                    Зачем это нужно
                </h3>
                <p className="!text-base !leading-relaxed !text-gray-700">
                    ВКонтакте периодически добавляет новые категории товаров или изменяет их структуру.
                    Чтобы использовать свежие категории при создании товаров, нужно нажать эту кнопку.
                </p>

                <div className="not-prose mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <p className="text-sm text-yellow-900">
                        <strong>Важно:</strong> Обновление не изменяет категории у существующих товаров.
                        Оно только обновляет список доступных категорий для новых товаров.
                    </p>
                </div>

                <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                    Как работает кнопка
                </h3>
                <ul className="!text-base !leading-relaxed !text-gray-700">
                    <li>
                        <strong>В обычном состоянии:</strong> иконка круговой стрелки (SVG), серый цвет
                    </li>
                    <li>
                        <strong>При наведении:</strong> фон становится светло-серым
                    </li>
                    <li>
                        <strong>При загрузке:</strong> иконка заменяется на spinner (крутящийся индикатор)
                    </li>
                    <li>
                        <strong>Подсказка:</strong> "Обновить список категорий товаров из VK" (при
                        наведении курсора)
                    </li>
                </ul>

                <Sandbox
                    title="Кнопка обновления категорий"
                    description="Нажмите на кнопку, чтобы увидеть процесс обновления."
                    instructions={[
                        'Нажмите на кнопку с <strong>круговой стрелкой</strong>',
                        'Иконка сменится на <strong>индикатор загрузки</strong> (spinner)',
                        'Через 2 секунды появится сообщение об успешном обновлении',
                    ]}
                >
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <RefreshCategoriesButtonMock
                            isRefreshing={isRefreshing}
                            onClick={handleRefresh}
                        />
                        <p className="text-sm text-gray-600">
                            Кнопка обновления категорий (находится в шапке страницы "Товары")
                        </p>
                    </div>
                </Sandbox>
            </section>
        </>
    );
};
