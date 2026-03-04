import React from 'react';

// =====================================================================
// Секция «Введение» + сравнение «Было / Стало»
// =====================================================================

export const IntroSection: React.FC = () => (
    <>
        {/* Введение */}
        <p className="!text-base !leading-relaxed !text-gray-700">
            Вкладка "Список рассылки" (или "Журнал отправки призов") — это <strong>история доставки промокодов победителям</strong> конкурса отзывов. 
            Здесь вы видите кому, когда и как был отправлен каждый промокод, а также можете повторить отправку в случае ошибки.
        </p>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Этот журнал — ваша страховка от потерянных призов. Если победитель пишет "Мне не пришёл промокод", вы сразу видите: 
            отправлялось ли сообщение, какой был статус доставки, когда это произошло.
        </p>

        <hr className="!my-10" />

        {/* Было / Стало */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как было раньше vs как стало</h2>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            {/* Было */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center text-2xl">❌</div>
                    <h3 className="text-xl font-bold text-red-900">Без системы</h3>
                </div>
                <ul className="space-y-3 text-sm text-red-800">
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Не было истории отправок — невозможно проверить кому и когда отправлялись призы</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Если победитель жаловался "Не пришло" — приходилось гадать, отправляли мы или нет</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>При ошибке доставки промокод терялся, нужно было вручную разбираться</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Не было способа повторить отправку автоматически</span>
                    </li>
                </ul>
            </div>

            {/* Стало */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-2xl">✅</div>
                    <h3 className="text-xl font-bold text-green-900">С системой</h3>
                </div>
                <ul className="space-y-3 text-sm text-green-800">
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Полная история: кто получил, какой промокод, когда отправлено</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Статус доставки: видно успешно ли отправлено в ЛС или была ошибка</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Автоматический запасной вариант: если ЛС закрыто — система сама отправляет комментарием</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Кнопки повторной отправки — можно попробовать снова одним кликом</span>
                    </li>
                </ul>
            </div>
        </div>
    </>
);
