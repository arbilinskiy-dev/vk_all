import React from 'react';
import { Sandbox } from '../shared';
import { MockFooterStatesInline } from './FooterSaveButton_Mocks';

// =====================================================================
// Секция 6: Состояния блокировки кнопок — когда disabled
// =====================================================================

export const BlockingSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Когда кнопки блокируются
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Кнопки в футере могут быть заблокированы (<code>disabled</code>) в нескольких ситуациях. Заблокированная кнопка не реагирует на клики и визуально отличается от активной.
        </p>

        <Sandbox
            title="🔒 Интерактивная демонстрация блокировки"
            description="Посмотрите, как меняется футер в зависимости от состояния формы."
            instructions={[
                '<strong>Состояние 1:</strong> Обычное — кнопки активны',
                '<strong>Состояние 2:</strong> Поле пустое — кнопка "Сохранить" серая',
                '<strong>Состояние 3:</strong> Идёт сохранение — обе кнопки частично заблокированы'
            ]}
        >
            <div className="flex flex-col gap-4">
                <div className="text-sm text-gray-600 mb-2">
                    Кликайте по кнопкам, чтобы переключать состояния:
                </div>
                <MockFooterStatesInline />
            </div>
        </Sandbox>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Условия блокировки
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В реальном коде кнопка «Сохранить» блокируется, если:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><strong>Идёт сохранение</strong> (<code>isSaving === true</code>)</li>
            <li><strong>Поле пустое</strong> (<code>!title.trim()</code>) — нельзя сохранить пустое название</li>
            <li><strong>Данные не изменились</strong> (<code>!isDirty</code>) — в некоторых окнах (например, настройки проекта)</li>
            <li><strong>Работает AI</strong> (<code>isAiRunning</code>) — в окнах с AI-генерацией</li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Примеры из реального кода
        </h3>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`// CreateAlbumModal.tsx (строка 64)
disabled={isSaving || !title.trim()}

// NoteModal.tsx (строка 115)
disabled={isSaving || !text.trim()}

// ProjectSettingsModal.tsx (строка 227)
disabled={isSaving || isAiRunning || !isDirty}`}
            </pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Визуальные изменения при блокировке
        </h3>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><strong>Цвет кнопки:</strong> <code>bg-green-600</code> → <code>bg-gray-400</code> (зелёная становится серой)</li>
            <li><strong>Прозрачность кнопки "Отмена":</strong> <code>opacity: 1</code> → <code>opacity: 0.5</code></li>
            <li><strong>Курсор:</strong> обычный → <code>cursor-not-allowed</code> (перечёркнутый круг) или <code>cursor-wait</code> (песочные часы)</li>
        </ul>
    </section>
);
