/**
 * Секция «Интерактивная демонстрация»: песочница с кликабельными фильтрами.
 *
 * Содержит собственный state (activeAlbumId) и логику фильтрации mock-товаров.
 */
import React, { useState } from 'react';
import { Sandbox } from '../shared';
import {
    AlbumFiltersMock,
    ProductCardMini,
    mockAlbums,
    mockProducts,
    MockProduct,
} from './ProductsAlbumFiltersPage_MockComponents';

export const SandboxSection: React.FC = () => {
    const [activeAlbumId, setActiveAlbumId] = useState<string>('all');

    const totalCount = mockProducts.length;
    const withoutAlbumCount = mockProducts.filter(p => p.album_ids.length === 0).length;

    // Логика фильтрации
    const getFilteredProducts = (): MockProduct[] => {
        if (activeAlbumId === 'all') return mockProducts;
        if (activeAlbumId === 'none') return mockProducts.filter(p => p.album_ids.length === 0);
        return mockProducts.filter(p => p.album_ids.includes(Number(activeAlbumId)));
    };

    const filteredProducts = getFilteredProducts();

    return (
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                🎮 Интерактивная демонстрация
            </h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Попробуйте взаимодействовать с фильтрами и увидите, как меняется список товаров:
            </p>

            <Sandbox
                title="Фильтрация по подборкам"
                description="Кликайте по кнопкам, наведите курсор на иконку со стрелкой (откроется подборка в VK), попробуйте создать новую подборку."
                instructions={[
                    'Нажмите <strong>"Все"</strong> — увидите все 6 товаров',
                    'Нажмите <strong>"Без подборки"</strong> — останется 2 товара',
                    'Выберите <strong>"Новинки"</strong> — покажется 2 товара из этой подборки',
                    'Кликните <strong>иконку со стрелкой</strong> рядом с подборкой — откроется VK (в реальности)',
                    'Нажмите <strong>"+ Создать подборку"</strong>, введите название и нажмите Enter',
                ]}
            >
                <div className="space-y-4">
                    {/* Фильтры */}
                    <AlbumFiltersMock
                        albums={mockAlbums}
                        itemsCount={totalCount}
                        itemsWithoutAlbumCount={withoutAlbumCount}
                        activeAlbumId={activeAlbumId}
                        onSelectAlbum={setActiveAlbumId}
                    />

                    {/* Результат фильтрации */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                            Найдено товаров: <strong>{filteredProducts.length}</strong>
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {filteredProducts.map((product) => (
                                <ProductCardMini key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </Sandbox>
        </section>
    );
};
