/**
 * Секция «Итоги» страницы обучения «Конкурс отзывов».
 * Содержит резюме преимуществ автоматизации и важные рекомендации.
 */
import React from 'react';

export const SummarySection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Итоги</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Конкурс отзывов</strong> — это комплексная автоматизация, которая экономит часы ручной работы. 
            Система берет на себя весь цикл: от поиска участников до вручения призов.
        </p>

        {/* Преимущества автоматизации */}
        <div className="not-prose my-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">✅ Что дает автоматизация:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                    <p className="font-semibold text-green-800 mb-2">Экономия времени:</p>
                    <ul className="space-y-1 list-disc list-inside">
                        <li>Поиск отзывов: с 30 мин → на 0 мин</li>
                        <li>Регистрация участников: с 1 ч → на 5 мин</li>
                        <li>Подведение итогов: с 30 мин → на 2 мин</li>
                        <li><strong>Итого: ~2 часа в неделю</strong></li>
                    </ul>
                </div>
                <div>
                    <p className="font-semibold text-green-800 mb-2">Снижение ошибок:</p>
                    <ul className="space-y-1 list-disc list-inside">
                        <li>Нет пропущенных отзывов</li>
                        <li>Нет забытых комментариев</li>
                        <li>Нет ошибок в промокодах</li>
                        <li>Нет повторных победителей (ЧС)</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Рекомендации */}
        <div className="not-prose my-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-yellow-900 mb-2">📝 Важно помнить:</p>
            <ul className="space-y-1 text-sm text-gray-700">
                <li>• <strong>Проверяйте баланс промокодов</strong> — если они закончатся, победители не получат призы</li>
                <li>• <strong>Следите за статусами</strong> — если много ошибок, проверьте настройки VK API</li>
                <li>• <strong>Используйте логи</strong> — при проблемах они помогут найти причину</li>
                <li>• <strong>Тестируйте шаблоны</strong> — перед запуском конкурса убедитесь, что предпросмотр выглядит правильно</li>
            </ul>
        </div>
    </section>
);
