/**
 * Секция «Превью в реальном времени», «Советы по настройке» и «Заключение».
 *
 * Завершающий блок страницы настроек конкурса отзывов.
 */
import React from 'react';

// =====================================================================
// Превью + Советы + Заключение
// =====================================================================
export const PreviewAndTipsSection: React.FC = () => (
    <>
        {/* ===== ПРЕВЬЮ В РЕАЛЬНОМ ВРЕМЕНИ ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Превью в реальном времени
            </h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                В реальном приложении справа от настроек находится <strong>панель предпросмотра</strong>, где вы видите, как будут выглядеть все сообщения с подставленными переменными. Это помогает проверить корректность шаблонов до запуска конкурса.
            </p>

            <div className="not-prose mt-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-purple-900 mb-3">👁️ Что показывается в превью</h3>
                    <ul className="space-y-2 text-sm text-purple-900">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span><strong>Пост участника</strong> с вашим комментарием-регистрацией</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span><strong>Пост с итогами</strong> на стене сообщества</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span><strong>Личное сообщение победителю</strong> с промокодом</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span><strong>Fallback комментарий</strong> на случай ошибки отправки</span>
                        </li>
                    </ul>
                    <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                        <p className="text-xs text-gray-600">
                            Все переменные (например, <code className="bg-gray-100 px-1 py-0.5 rounded">{'{number}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">{'{promo_code}'}</code>) заменяются реальными значениями из базы данных.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <hr className="!my-10" />

        {/* ===== СОВЕТЫ ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Советы по настройке
            </h2>

            <div className="not-prose mt-6 grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-yellow-900 mb-2">💡 Тестируйте шаблоны</h3>
                    <p className="text-sm text-yellow-800">
                        Перед запуском конкурса проверьте все шаблоны в превью. Убедитесь, что переменные подставляются корректно и тексты выглядят естественно.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-blue-900 mb-2">🔄 Режим "Смешанный"</h3>
                    <p className="text-sm text-blue-800">
                        Используйте режим "День + Количество", если хотите проводить розыгрыши регулярно, но только при достаточном числе участников.
                    </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-green-900 mb-2">✅ Автобан победителей</h3>
                    <p className="text-sm text-green-800">
                        Включайте автоматический черный список на 7-30 дней, чтобы дать шанс другим пользователям выиграть. Это повышает доверие к конкурсу.
                    </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-purple-900 mb-2">📝 Ясные тексты</h3>
                    <p className="text-sm text-purple-800">
                        Пишите простые и понятные тексты в шаблонах. Избегайте двусмысленностей — участники должны четко понимать, что делать.
                    </p>
                </div>
            </div>
        </section>

        <hr className="!my-10" />

        {/* ===== ЗАКЛЮЧЕНИЕ ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Что дальше?
            </h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                После настройки всех параметров система готова к работе. Перейдите на вкладку <strong>"Посты"</strong>, чтобы запустить сбор участников и управлять конкурсом в режиме реального времени.
            </p>
        </section>
    </>
);
