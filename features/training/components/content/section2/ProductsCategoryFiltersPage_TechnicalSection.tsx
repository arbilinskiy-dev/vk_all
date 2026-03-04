/**
 * Секция «Технические особенности + Итоги» — ленивая загрузка, портал, кэширование; резюме.
 */
import React from 'react';

export const TechnicalSection: React.FC = () => (
    <>
        {/* Технические особенности */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                ⚙️ Технические особенности
            </h2>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Ленивая загрузка категорий
            </h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Категории загружаются не сразу при открытии страницы "Товары", а только при первом
                открытии любого селектора категорий. Это ускоряет начальную загрузку страницы.
            </p>
            <div className="not-prose mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-blue-900">
                    После первой загрузки категории кэшируются в памяти и не загружаются повторно до
                    обновления страницы.
                </p>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Состояние загрузки
            </h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Во время загрузки категорий в dropdown отображается:
            </p>
            <div className="not-prose mt-3 p-4 bg-gray-100 rounded text-center">
                <p className="text-sm text-gray-500">Загрузка...</p>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Позиционирование dropdown
            </h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Dropdown использует <code>createPortal</code> из React — он рендерится в
                корне документа (не внутри таблицы). Это решает проблему обрезания dropdown при
                скролле таблицы.
            </p>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li>z-index: 100 (выше всех элементов таблицы)</li>
                <li>Позиция рассчитывается динамически при открытии</li>
                <li>Обновляется при скролле и ресайзе окна</li>
            </ul>
        </section>

        <hr className="!my-10" />

        {/* Итоги */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">✅ Итоги</h2>
            <div className="not-prose mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <h4 className="font-bold text-green-900 mb-4 text-lg">Что вы узнали:</h4>
                <ul className="text-sm text-green-800 space-y-2">
                    <li>
                        ✅ В приложении нет кнопок фильтрации по категориям — категории выбираются
                        через выпадающий список
                    </li>
                    <li>
                        ✅ Селектор категорий имеет поиск и группировку по разделам (Одежда, Обувь...)
                    </li>
                    <li>
                        ✅ Выбранная категория отображается в два ряда: жирная конечная + серый путь
                    </li>
                    <li>
                        ✅ Кнопка с круговой стрелкой обновляет справочник категорий из VK
                    </li>
                    <li>
                        ✅ Категории загружаются один раз при первом открытии селектора (ленивая
                        загрузка)
                    </li>
                    <li>
                        ✅ Dropdown использует portal для корректного отображения поверх таблицы
                    </li>
                </ul>
            </div>
        </section>
    </>
);
