import React from 'react';
import { Sandbox } from '../shared';
import {
    DeliveryStatusesDemo,
    CountersAndActionsDemo,
    SendingTableDemo,
} from './ProductsReviewsContestSendingListPage_Demos';

// =====================================================================
// Секция «Двухэтапная доставка» + 3 интерактивных Sandbox-демо
// =====================================================================

export const DeliverySection: React.FC = () => (
    <>
        {/* Sandbox 1: Статусы */}
        <Sandbox
            title="🏷️ Статусы доставки"
            description="Переключайте между статусами, чтобы увидеть разницу в отображении и понять логику двухэтапной доставки."
            instructions={[
                '<strong>"Доставлено (ЛС)"</strong> (зелёный бейдж) — промокод успешно отправлен через личные сообщения',
                '<strong>"Ошибка ЛС"</strong> (красный бейдж) — ЛС закрыто, но промокод отправлен комментарием под постом победителя',
                'У записей с ошибкой доступна кнопка "Повторить" для повторной попытки отправки в ЛС'
            ]}
        >
            <DeliveryStatusesDemo />
        </Sandbox>

        <hr className="!my-10" />

        {/* Двухэтапная доставка */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Двухэтапная система доставки</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Система использует <strong>двухэтапную логику доставки</strong>, чтобы промокоды гарантированно дошли до победителей:
        </p>

        <div className="not-prose my-6 space-y-4">
            {/* Этап 1 */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-green-700">1</div>
                    <div>
                        <p className="font-semibold text-green-900">Попытка отправки в личные сообщения (ЛС)</p>
                        <p className="text-sm text-green-800 mt-1">
                            Сначала система пытается отправить промокод через личные сообщения ВКонтакте. 
                            Это самый надёжный способ — пользователь получает уведомление и видит сообщение в своих диалогах.
                        </p>
                        <p className="text-xs text-green-700 mt-2"><strong>Статус при успехе:</strong> "Доставлено (ЛС)" (зелёный бейдж)</p>
                    </div>
                </div>
            </div>

            {/* Этап 2 */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-yellow-700">2</div>
                    <div>
                        <p className="font-semibold text-yellow-900">Запасной вариант: отправка комментарием</p>
                        <p className="text-sm text-yellow-800 mt-1">
                            Если личные сообщения закрыты (многие пользователи запрещают ЛС от сообществ), система <strong>автоматически</strong> 
                            оставляет комментарий с промокодом под постом победителя. Промокод НЕ теряется!
                        </p>
                        <p className="text-xs text-yellow-700 mt-2"><strong>Статус при ошибке ЛС:</strong> "Ошибка ЛС" (красный бейдж) + подпись "Отправлен комментарий"</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Информационный блок */}
        <div className="not-prose bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm text-blue-900">
                <strong>💡 Важно понимать:</strong> Статус "Ошибка ЛС" НЕ означает, что промокод потерян. 
                Это значит, что он доставлен альтернативным способом — комментарием. 
                Но вы можете попробовать отправить повторно в ЛС, если победитель позже открыл личные сообщения.
            </p>
        </div>

        <hr className="!my-10" />

        {/* Sandbox 2: Счётчики и кнопки */}
        <Sandbox
            title="📊 Счётчики и массовая отправка"
            description="Попробуйте нажать кнопку 'Повторить всем', чтобы увидеть как работает массовая повторная отправка."
            instructions={[
                'Счётчик <strong>"Успешно"</strong> (зелёный) — количество промокодов, доставленных через ЛС',
                'Счётчик <strong>"Ошибки"</strong> (красный) — количество отправленных комментарием (ЛС было закрыто)',
                'Кнопка <strong>"Повторить всем"</strong> появляется только если есть ошибки. Нажмите для массовой повторной отправки'
            ]}
        >
            <CountersAndActionsDemo />
        </Sandbox>

        <hr className="!my-10" />

        {/* Sandbox 3: Таблица */}
        <Sandbox
            title="📋 Интерактивная таблица отправок"
            description="Наведите курсор на элементы таблицы, чтобы увидеть интерактивные эффекты."
            instructions={[
                'Наведите курсор на <strong>иконку чата</strong> (три точки) — она изменит цвет на indigo-600',
                'Обратите внимание на <strong>моноширинный шрифт</strong> для промокодов (удобно читать)',
                'Кнопка <strong>"Повторить"</strong> видна только у записей со статусом "Ошибка ЛС"',
                'ID пользователя — кликабельная ссылка на профиль ВКонтакте'
            ]}
        >
            <SendingTableDemo />
        </Sandbox>
    </>
);
