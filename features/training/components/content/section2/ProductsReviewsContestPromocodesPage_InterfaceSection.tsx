import React from 'react';
import { Sandbox } from '../shared';
import { UploadFormDemo } from './ProductsReviewsContestPromocodesPage_UploadFormDemo';

// =====================================================================
// Секция: Структура интерфейса + Формат загрузки + Песочница формы
// =====================================================================
export const InterfaceSection: React.FC = () => (
    <>
        {/* Структура интерфейса */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Структура интерфейса: 2 колонки</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Интерфейс промокодов разделён на <strong>две части</strong>:
        </p>

        <div className="not-prose my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-bold text-indigo-900 mb-2">📝 Левая колонка (1/3 ширины)</h3>
                <p className="text-sm text-indigo-800 mb-2"><strong>Форма загрузки</strong></p>
                <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
                    <li>Textarea для ввода промокодов</li>
                    <li>Подсказка формата (голубой блок)</li>
                    <li>Кнопка "Загрузить в базу"</li>
                    <li>Автоматическая обработка вставки из Excel</li>
                </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">📊 Правая колонка (2/3 ширины)</h3>
                <p className="text-sm text-gray-800 mb-2"><strong>Таблица с промокодами</strong></p>
                <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                    <li>7 колонок: Чекбокс, Код, Описание, Статус, Кому выдан, Диалог, Удалить</li>
                    <li>Счётчики: Всего / Свободно / Выдано</li>
                    <li>Редактирование описания (появляется при наведении)</li>
                    <li>Массовое удаление через чекбоксы</li>
                </ul>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Формат загрузки */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Формат загрузки промокодов</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Промокоды загружаются в формате <code className="bg-gray-100 px-2 py-1 rounded text-sm">КОД | ОПИСАНИЕ</code>, 
            где вертикальная черта разделяет сам промокод и его описание (что получит победитель).
        </p>

        <div className="not-prose bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm font-semibold text-blue-900 mb-2">Пример правильного формата:</p>
            <pre className="bg-white/50 p-3 rounded font-mono text-xs text-blue-800 overflow-x-auto custom-scrollbar">
PROMO500 | Скидка 500₽ на заказ{'\n'}
SALE30OFF | Скидка 30% на всё меню{'\n'}
FREESHIP | Бесплатная доставка{'\n'}
BIRTHDAY20 | Подарок на день рождения
            </pre>
        </div>

        <div className="not-prose bg-green-50 border-l-4 border-green-400 p-4 my-6">
            <p className="text-sm text-green-900">
                <strong>💡 Секретная фича:</strong> Система автоматически распознаёт данные из Excel! 
                Просто скопируйте два столбца (код + описание) и вставьте в форму — табуляция между ними преобразуется в вертикальную черту автоматически.
            </p>
            <p className="text-xs text-green-700 mt-2">
                Это работает благодаря обработчику <code>handlePasteCodes</code> в хуке <code>usePromocodesManager</code> (строки 44-64).
            </p>
        </div>

        <hr className="!my-10" />

        {/* Песочница: Форма загрузки */}
        <Sandbox
            title="📝 Интерактивная форма загрузки"
            description="Попробуйте изменить текст в поле ввода. Обратите внимание на формат подсказки и цветовую схему (indigo-600 для кнопки)."
            instructions={[
                'Формат <code>КОД | ОПИСАНИЕ</code> — каждая пара с новой строки',
                'Голубая подсказка (bg-blue-50) объясняет формат загрузки',
                'Кнопка "Загрузить в базу" использует цвет indigo-600 (фирменный цвет интерактивных элементов)',
                'Textarea имеет моноширинный шрифт (<code>font-mono</code>) для удобства'
            ]}
        >
            <UploadFormDemo />
        </Sandbox>

        <hr className="!my-10" />
    </>
);
