/**
 * Секция «Введение»: важное уточнение + сравнение «Было / Стало».
 */
import React from 'react';

export const IntroSection: React.FC = () => (
    <>
        {/* Важное уточнение */}
        <div className="not-prose mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-sm text-yellow-900">
                <strong>Важно:</strong> В приложении нет отдельных кнопок фильтрации по категориям
                (как для альбомов). Категории используются через выпадающий список в каждой строке
                товара и при создании новых товаров.
            </p>
        </div>

        {/* Введение: Было/Стало */}
        <section>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Категории товаров — это обязательное поле для каждого товара в VK. Правильная
                категория помогает покупателям находить товары через поиск и фильтры ВКонтакте.
            </p>

            <div className="not-prose mt-6 grid grid-cols-2 gap-6">
                {/* Было */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-bold text-red-900 mb-3">❌ Раньше (в VK)</h4>
                    <ul className="text-sm text-red-800 space-y-2">
                        <li>• Выбор категории — длинный список без группировки</li>
                        <li>• Нет поиска — нужно листать сотни категорий</li>
                        <li>• Не видно структуру (раздел → категория → подкатегория)</li>
                        <li>• Если VK добавил новые категории — приходится заново заходить в товар</li>
                    </ul>
                </div>

                {/* Стало */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-bold text-green-900 mb-3">✅ Теперь (в приложении)</h4>
                    <ul className="text-sm text-green-800 space-y-2">
                        <li>• Категории сгруппированы по разделам (Одежда, Обувь...)</li>
                        <li>• Поиск по названию — находите категорию за секунду</li>
                        <li>• Двухстрочное отображение: жирная конечная + серый путь</li>
                        <li>• Кнопка обновления — загружает новые категории из VK</li>
                    </ul>
                </div>
            </div>
        </section>
    </>
);
