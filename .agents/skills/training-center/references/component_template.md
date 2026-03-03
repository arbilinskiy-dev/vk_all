# Component Template — Шаблон и стилизация контент-компонента

## Шаблон нового раздела

```tsx
import React, { useState } from 'react';

interface ContentProps {
    title: string;
}

// =====================================================================
// Компонент Sandbox (переиспользуй для интерактивных блоков)
// =====================================================================
const Sandbox: React.FC<{ 
    title: string; 
    description: string; 
    children: React.ReactNode;
    instructions?: string[];
}> = ({ title, description, children, instructions }) => (
    <div className="relative not-prose p-6 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 mt-12">
        <h4 className="text-xl font-bold text-indigo-800 mb-2">{title}</h4>
        <p className="text-sm text-indigo-700 mb-4">{description}</p>
        {instructions && instructions.length > 0 && (
            <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1 mb-6">
                {instructions.map((item, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
            </ul>
        )}
        {children}
    </div>
);

// =====================================================================
// Основной компонент раздела
// =====================================================================
export const ИмяКомпонента: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose prose-indigo max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Что это такое?</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>Описание функционала</strong> — краткое объяснение.
            </p>

            <hr className="!my-10" />

            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">1. Название подраздела</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">Подробное описание...</p>

            <Sandbox 
                title="Попробуйте сами: Название демо" 
                description="Инструкция, что можно делать."
                instructions={[
                    '<strong>Кликните</strong> на элемент, чтобы увидеть реакцию.',
                    '<strong>Наведите</strong> курсор для появления подсказки.',
                ]}
            >
                <div className="bg-white p-4 rounded-lg border">
                    {/* Mock-компонент */}
                </div>
            </Sandbox>

            <hr className="!my-10" />
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">2. Следующий подраздел</h2>
        </article>
    );
};
```

## Обязательные классы для типографики

Внутри `<article className="prose prose-indigo max-w-none">`:

| Элемент | Классы |
|---------|--------|
| `<h1>` (заголовок страницы) | `!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6` |
| `<h2>` (секция) | `!text-2xl !font-bold !tracking-tight !text-gray-900` |
| `<h3>` (подсекция) | `!text-xl !font-semibold !text-gray-800 !mt-8` |
| `<p>` | `!text-base !leading-relaxed !text-gray-700` |
| `<hr>` (разделитель) | `!my-10` |

## Стилизация интерактивных блоков

- **ВСЕГДА** оборачивать в `<div className="not-prose">` — отключает стили prose
- Использовать компонент `Sandbox` для единообразия
- Mock-компоненты выносить в отдельный файл `*Mocks.tsx`

## Цветовая схема Sandbox

- Рамка: `border-indigo-300` (пунктирная, `border-dashed`)
- Фон: `bg-indigo-50/50`
- Заголовок: `text-indigo-800`
- Текст инструкций: `text-indigo-700`

## Регистрация в TopicContent.tsx

```tsx
// 1. Добавь импорт
import { НовыйРаздел } from './content/НовыйРаздел';

// 2. Добавь в componentMap
const componentMap: Record<string, React.FC<{ title: string }>> = {
    '2-4-3-postcard-deep-dive': PostCardDeepDive,
    '2-1-sidebar-nav': SidebarNavDeepDive,
    'путь-из-tocData': НовыйРаздел,  // ← НОВОЕ
};
```
