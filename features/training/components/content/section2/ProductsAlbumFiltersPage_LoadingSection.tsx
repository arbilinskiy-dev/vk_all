/**
 * Секция «Состояние загрузки (Skeleton)»: демо скелетона + описание деталей.
 */
import React from 'react';
import { Sandbox } from '../shared';
import { AlbumFiltersMock } from './ProductsAlbumFiltersPage_MockComponents';

export const LoadingSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            ⏳ Состояние загрузки (Skeleton)
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Пока данные о подборках загружаются с сервера, вместо реальных кнопок отображаются <strong>4 серых блока</strong> с пульсирующей анимацией. Это показывает пользователю, что система работает.
        </p>

        <Sandbox
            title="Состояние загрузки"
            description="Так выглядят фильтры во время загрузки данных:"
        >
            <AlbumFiltersMock
                albums={[]}
                itemsCount={0}
                itemsWithoutAlbumCount={0}
                activeAlbumId="all"
                onSelectAlbum={() => {}}
                isLoading={true}
            />
        </Sandbox>

        <p className="!text-base !leading-relaxed !text-gray-700 !mt-4">
            <strong>Детали реализации:</strong>
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li>4 блока разной ширины (имитация разных длин названий подборок)</li>
            <li>Высота: 36px (h-9) — как у реальных кнопок</li>
            <li>Цвет: серый (#E5E7EB, Tailwind gray-200)</li>
            <li>Анимация: пульсация (animate-pulse)</li>
        </ul>
    </section>
);
