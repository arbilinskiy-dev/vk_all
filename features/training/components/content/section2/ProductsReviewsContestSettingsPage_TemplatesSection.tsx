/**
 * Секция «Шаблоны сообщений» — четыре шаблона для автоматической
 * коммуникации с участниками и победителями конкурса.
 *
 * Содержит:
 *   1. Комментарий регистрации
 *   2. Личное сообщение победителю
 *   3. Комментарий при ошибке отправки ЛС
 *   4. Пост с итогами
 */
import React from 'react';
import { RichTemplateEditorMock } from './ProductsReviewsContestSettingsPage_Mocks';

// =====================================================================
// Блок 3: Шаблоны сообщений
// =====================================================================
export const TemplatesSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Блок 3: Шаблоны сообщений
        </h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Самый важный блок настроек — здесь вы создаёте тексты, которые будут автоматически отправляться участникам и публиковаться в сообществе. <strong>Используйте переменные</strong> — они автоматически подставят нужные значения.
        </p>

        <div className="not-prose mt-6 space-y-6">
            {/* Шаблон 1: Комментарий регистрации */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">1️⃣ Шаблон комментария (Регистрация)</h3>
                <RichTemplateEditorMock
                    label="Комментарий под отзывом участника"
                    value="Спасибо за отзыв! Ваш номер участника: {number}. Желаем удачи! 🍀"
                    specificVariables={[
                        { name: 'Номер', value: '{number}' }
                    ]}
                    helpText="Это комментарий оставляется автоматически под отзывом пользователя, когда он регистрируется в конкурсе."
                />
            </div>

            {/* Шаблон 2: Сообщение победителю */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">2️⃣ Сообщение победителю (ЛС)</h3>
                <RichTemplateEditorMock
                    label="Личное сообщение победителю"
                    value="Поздравляем, {user_name}! 🎉\n\nВы выиграли в конкурсе отзывов.\nВаш приз: {description}\nВаш промокод: {promo_code}\n\nИспользуйте его при следующем заказе!"
                    specificVariables={[
                        { name: 'Промокод', value: '{promo_code}' },
                        { name: 'Приз', value: '{description}' },
                        { name: 'Имя', value: '{user_name}' }
                    ]}
                    helpText="Это сообщение отправляется победителю в личные сообщения от лица сообщества."
                />
            </div>

            {/* Шаблон 3: Ошибка отправки */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">3️⃣ Ошибка отправки (Комментарий)</h3>
                <RichTemplateEditorMock
                    label="Комментарий при ошибке отправки ЛС"
                    value="{user_name}, поздравляем с победой! 🎊\n\nНе смогли отправить вам промокод в ЛС. Напишите нам в сообщения сообщества, чтобы получить приз!"
                    specificVariables={[
                        { name: 'Имя', value: '{user_name}' }
                    ]}
                    helpText="Этот комментарий оставляется под отзывом победителя, если не удалось отправить ему ЛС (закрыты сообщения)."
                />
            </div>

            {/* Шаблон 4: Пост с итогами */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">4️⃣ Текст поста с итогами</h3>
                <RichTemplateEditorMock
                    label="Публикация в сообществе"
                    value="🏆 Поздравляем победителей конкурса отзывов!\n\n{winners_list}\n\nСпасибо всем за участие! Следите за новыми конкурсами. ❤️"
                    specificVariables={[
                        { name: 'Список', value: '{winners_list}' }
                    ]}
                    helpText="Этот пост публикуется автоматически на стене сообщества при подведении итогов. Переменная {winners_list} подставит список победителей."
                />
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Совет:</strong> К посту можно добавить изображения через раздел "Медиавложения" ниже редактора. Они будут прикреплены к публикации автоматически.
                    </p>
                </div>
            </div>
        </div>
    </section>
);
