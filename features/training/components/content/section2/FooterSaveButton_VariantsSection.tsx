import React from 'react';
import { Sandbox } from '../shared';
import { MockFooterVariantsInline } from './FooterSaveButton_Mocks';

// =====================================================================
// Секция 7: Альтернативные варианты футера
// =====================================================================

export const VariantsSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Альтернативные варианты футера
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Хотя большинство футеров выглядят одинаково (кнопки справа), есть несколько исключений, когда структура отличается.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Футер с кнопками слева и справа
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В окне редактирования поста (PostModalFooter) используется футер с <code>justify-between</code> вместо <code>justify-end</code>. Это означает, что кнопки распределены по краям — слева кнопка «Удалить», справа «Сохранить» и «Опубликовать сейчас».
        </p>

        <Sandbox
            title="📐 Варианты расположения кнопок"
            description="Сравните стандартный футер и футер с распределёнными кнопками."
        >
            <MockFooterVariantsInline />
        </Sandbox>

        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`// Стандартный футер (кнопки справа)
<footer className="... flex justify-end gap-3 ...">

// Футер поста (кнопки по краям)
<footer className="... flex justify-between items-center ...">`}
            </pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Футер с одной кнопкой
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В модальных окнах просмотра (например, результаты сохранения, предпросмотр конкурса) есть только одна кнопка «Закрыть» — действие уже завершено, менять ничего не нужно, только посмотреть информацию и закрыть окно.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Цвет фона футера
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В большинстве окон используется <code>bg-gray-50</code> (очень светло-серый), но в некоторых окнах товаров применяется <code>bg-white</code> (белый). Это сделано для визуального единообразия с остальным интерфейсом модалки.
        </p>
    </section>
);
