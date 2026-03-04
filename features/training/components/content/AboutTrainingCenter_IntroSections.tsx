import React from 'react';
import { Sandbox, MockTableOfContents, InteractiveSandboxDemo } from './AboutTrainingCenter_Mocks';

// =====================================================================
// Секции «Вводная часть» страницы «О Центре обучения»
// =====================================================================

// ---------------------------------------------------------------------
// Приветствие — градиентный баннер
// ---------------------------------------------------------------------
export const WelcomeSection: React.FC = () => (
    <div className="not-prose bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">👋 Добро пожаловать в Центр обучения!</h2>
        <p className="text-indigo-100 text-lg">
            Здесь вы найдёте всё, что нужно для эффективной работы с Планировщиком контента — 
            от базовых понятий до продвинутых техник автоматизации.
        </p>
    </div>
);

// ---------------------------------------------------------------------
// Что такое Центр обучения — описание + 3 карточки
// ---------------------------------------------------------------------
export const WhatIsSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">🎯 Что такое Центр обучения?</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Центр обучения</strong> — это интерактивная документация к приложению "Планировщик контента". 
            В отличие от обычных инструкций, здесь вы не только читаете текст, но и <strong>можете взаимодействовать 
            с элементами интерфейса</strong> прямо на страницах документации.
        </p>

        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <span className="text-3xl mb-2 block">📖</span>
                <h4 className="font-semibold text-blue-800">Читайте</h4>
                <p className="text-sm text-blue-600">Подробные объяснения каждой функции</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <span className="text-3xl mb-2 block">👀</span>
                <h4 className="font-semibold text-green-800">Смотрите</h4>
                <p className="text-sm text-green-600">Визуальные примеры интерфейса</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <span className="text-3xl mb-2 block">🖱️</span>
                <h4 className="font-semibold text-purple-800">Пробуйте</h4>
                <p className="text-sm text-purple-600">Интерактивные демо-элементы</p>
            </div>
        </div>
    </>
);

// ---------------------------------------------------------------------
// Для кого этот раздел — целевая аудитория
// ---------------------------------------------------------------------
export const TargetAudienceSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">👥 Для кого этот раздел?</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Центр обучения будет полезен всем пользователям системы:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><strong>Новичкам</strong> — чтобы быстро освоить основы и начать работать</li>
            <li><strong>Опытным пользователям</strong> — чтобы узнать о скрытых возможностях и горячих клавишах</li>
            <li><strong>Администраторам</strong> — чтобы разобраться в настройках и управлении командой</li>
        </ul>
    </>
);

// ---------------------------------------------------------------------
// Как работать с Центром обучения — оглавление + песочницы
// ---------------------------------------------------------------------
export const HowToUseSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">🧭 Как работать с Центром обучения</h2>
        
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Навигация по оглавлению</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Слева вы видите <strong>оглавление</strong> — дерево разделов и подразделов. 
            Кликайте на заголовки разделов, чтобы развернуть или свернуть их. 
            Выбирайте нужный подраздел — и его содержимое появится в этой области.
        </p>

        <Sandbox 
            title="Попробуйте сами: Навигация" 
            description="Это уменьшенная копия оглавления. Кликайте на разделы, чтобы развернуть их, и на подразделы, чтобы выбрать."
        >
            <MockTableOfContents />
        </Sandbox>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Интерактивные песочницы</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В каждом разделе вы найдёте <strong>песочницы</strong> — специальные блоки с пунктирной рамкой, 
            где можно попробовать функции интерфейса. Они выглядят так:
        </p>

        <Sandbox 
            title="Пример песочницы" 
            description="Попробуйте взаимодействовать с элементами ниже:"
            instructions={[
                '<strong>Кликните</strong> на первый блок несколько раз — счётчик увеличится.',
                '<strong>Кликните</strong> на второй блок — текст развернётся.',
            ]}
        >
            <InteractiveSandboxDemo />
        </Sandbox>
    </>
);
