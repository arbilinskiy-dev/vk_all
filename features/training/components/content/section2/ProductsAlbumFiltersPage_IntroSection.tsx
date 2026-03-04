/**
 * Секция «Введение»: описание + сравнение «Было / Стало».
 */
import React from 'react';

export const IntroSection: React.FC = () => (
    <section>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Фильтры по альбомам (подборкам) помогают быстро находить товары, относящиеся к определённой категории или акции. Это особенно удобно, когда в проекте сотни товаров.
        </p>

        <div className="not-prose mt-6 grid grid-cols-2 gap-6">
            {/* Было */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-bold text-red-900 mb-3">❌ Раньше (в VK)</h4>
                <ul className="text-sm text-red-800 space-y-2">
                    <li>• Заходили в раздел "Товары" сообщества</li>
                    <li>• Переключались между подборками через меню</li>
                    <li>• Каждая подборка открывалась отдельно</li>
                    <li>• Не видно количество товаров без подборки</li>
                    <li>• Нужно открывать новую вкладку для просмотра подборки в VK</li>
                </ul>
            </div>

            {/* Стало */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-bold text-green-900 mb-3">✅ Теперь (в приложении)</h4>
                <ul className="text-sm text-green-800 space-y-2">
                    <li>• Все подборки — кнопки в одной строке</li>
                    <li>• Видно количество товаров в каждой подборке</li>
                    <li>• Отдельная кнопка "Без подборки" для неразобранных товаров</li>
                    <li>• Быстрый переход в VK — иконка со стрелкой рядом с каждой подборкой</li>
                    <li>• Можно создать новую подборку прямо из фильтров</li>
                </ul>
            </div>
        </div>
    </section>
);
