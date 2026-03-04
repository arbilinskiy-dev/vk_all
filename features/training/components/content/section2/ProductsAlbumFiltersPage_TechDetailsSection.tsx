/**
 * Секция «Технические детали»: структура данных, формат ссылок, поведение кнопок.
 */
import React from 'react';

export const TechDetailsSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            🔧 Технические детали
        </h2>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Структура данных подборки (MarketAlbum)
        </h3>
        <div className="not-prose mt-3 p-4 bg-gray-50 rounded-lg font-mono text-sm">
            <pre className="text-gray-800">{`{
  id: 123,                    // Уникальный ID подборки в VK
  owner_id: -987654321,       // ID сообщества (отрицательное число)
  title: "Новинки",           // Название подборки
  count: 15,                  // Количество товаров в подборке
  updated_time: 1642512345    // Время последнего обновления (опционально)
}`}</pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Формат внешней ссылки
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Ссылка на подборку в VK формируется по шаблону:
        </p>
        <div className="not-prose mt-3 p-4 bg-blue-50 rounded-lg font-mono text-sm">
            <code className="text-blue-900">
                https://vk.com/market<span className="text-red-600">{'{owner_id}'}</span>?section=album_<span className="text-red-600">{'{id}'}</span>
            </code>
        </div>
        <p className="!text-base !leading-relaxed !text-gray-700 !mt-3">
            <strong>Пример:</strong> Подборка с <code>id=456</code> сообщества <code>owner_id=-123456789</code> откроется по адресу:<br />
            <code className="text-sm">https://vk.com/market-123456789?section=album_456</code>
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Поведение кнопки "Без подборки"
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Кнопка отображается только если выполняется условие:
        </p>
        <div className="not-prose mt-3 p-4 bg-yellow-50 rounded-lg font-mono text-sm">
            <code className="text-yellow-900">
                itemsWithoutAlbumCount {'>'} 0
            </code>
        </div>
        <p className="!text-base !leading-relaxed !text-gray-700 !mt-3">
            Количество рассчитывается как товары, у которых:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>album_ids === undefined</code> (поле отсутствует), <strong>или</strong></li>
            <li><code>album_ids.length === 0</code> (массив пустой)</li>
        </ul>
    </section>
);
