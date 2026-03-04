import React from 'react';

// =====================================================================
// Секция: Введение + сравнение «Было / Стало»
// =====================================================================
export const IntroSection: React.FC = () => (
    <>
        {/* Введение */}
        <p className="!text-base !leading-relaxed !text-gray-700">
            Вкладка "Промокоды" — это <strong>база призов</strong> для конкурса отзывов. 
            Здесь вы загружаете коды (промокоды на скидку, купоны, подарочные сертификаты), которые система будет автоматически выдавать победителям розыгрышей.
        </p>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Без этой базы конкурс не запустится — система не сможет наградить победителя. 
            Промокоды загружаются один раз, а дальше расходуются автоматически при каждом розыгрыше.
        </p>

        <hr className="!my-10" />

        {/* Было/Стало */}
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
                        <span>Промокоды хранились в Excel-файле или блокноте</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Вручную искали свободный код перед каждым розыгрышем</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Отмечали выданные коды вручную — легко было ошибиться и выдать один код дважды</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>Не было контроля запаса — могли закончиться промокоды в самый неожиданный момент</span>
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
                        <span>Загружаете всю партию промокодов разом (можно прямо из Excel)</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Система сама выбирает свободный код при розыгрыше</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Выданные коды автоматически помечаются — невозможно выдать дважды</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>Счётчик показывает сколько кодов осталось — видно когда нужно догрузить</span>
                    </li>
                </ul>
            </div>
        </div>

        <hr className="!my-10" />
    </>
);
