/**
 * Секция «Как работает фильтрация»: три режима + комбинация с поиском.
 */
import React from 'react';

export const FilterLogicSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            🧠 Как работает фильтрация
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Фильтрация по подборкам имеет <strong>три режима</strong>:
        </p>

        <div className="not-prose mt-6 space-y-4">
            <div className="p-4 bg-gray-50 border-l-4 border-gray-500 rounded">
                <h4 className="font-bold text-gray-900 mb-2">Режим 1: "Все" (activeAlbumId = 'all')</h4>
                <p className="text-sm text-gray-700">
                    Показываются <strong>все товары</strong> без ограничений по подборкам. Это режим по умолчанию.
                </p>
            </div>

            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <h4 className="font-bold text-yellow-900 mb-2">Режим 2: "Без подборки" (activeAlbumId = 'none')</h4>
                <p className="text-sm text-yellow-800">
                    Показываются только товары, у которых <code className="text-xs bg-yellow-200 px-1 py-0.5 rounded">album_ids</code> пустой или отсутствует.
                </p>
            </div>

            <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
                <h4 className="font-bold text-indigo-900 mb-2">Режим 3: Конкретная подборка (activeAlbumId = '123')</h4>
                <p className="text-sm text-indigo-800">
                    Показываются только товары, у которых в массиве <code className="text-xs bg-indigo-200 px-1 py-0.5 rounded">album_ids</code> есть этот ID подборки.
                </p>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Комбинация с поиском
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Важная особенность: фильтрация по подборкам применяется <strong>после поиска</strong>. Это означает:
        </p>
        <ol className="!text-base !leading-relaxed !text-gray-700">
            <li>Сначала товары фильтруются по строке поиска (если она заполнена)</li>
            <li>Затем из найденных товаров выбираются те, что соответствуют активной подборке</li>
        </ol>

        <div className="not-prose mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900">
                <strong>Пример:</strong> Вы ввели в поиск "футболка" и выбрали подборку "Акции". Покажутся только товары, в названии которых есть "футболка" <strong>И</strong> которые добавлены в подборку "Акции".
            </p>
        </div>
    </section>
);
