# Mock Components — Создание mock-компонентов

## Что такое mock-компоненты

Упрощённые копии реальных UI-элементов, которые:
- Выглядят как настоящие
- Поддерживают интерактивность (hover, click, drag)
- **НЕ** подключены к реальным данным или API

## Правила создания

1. **Один файл = один логический блок** (напр. `SidebarMocks.tsx` — все моки для сайдбара)
2. **Tailwind** для стилей (никаких inline-стилей)
3. **Состояния**: `isHovered`, `isActive`, `isLoading`, `isError`
4. **Изображения-заглушки**: `https://picsum.photos/seed/{unique}/width/height`
5. **НЕ импортировать** реальные компоненты приложения

## Шаблон mock-файла

```tsx
// features/training/components/content/МойРазделMocks.tsx
import React, { useState } from 'react';

// =====================================================================
// Типы
// =====================================================================
interface MockItemProps {
    name: string;
    count: number;
    isActive?: boolean;
    status?: 'normal' | 'error' | 'loading';
}

// =====================================================================
// Базовый mock-элемент
// =====================================================================
export const MockItem: React.FC<MockItemProps> = ({ 
    name, 
    count, 
    isActive = false,
    status = 'normal'
}) => {
    return (
        <div className={`p-3 rounded ${isActive ? 'bg-indigo-100' : 'bg-white'}`}>
            {name} ({count})
        </div>
    );
};

// =====================================================================
// Интерактивный mock с состоянием
// =====================================================================
export const InteractiveMockList: React.FC = () => {
    const [activeItem, setActiveItem] = useState<string | null>(null);
    
    const items = [
        { id: '1', name: 'Элемент 1', count: 5 },
        { id: '2', name: 'Элемент 2', count: 12 },
    ];
    
    return (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.id} onClick={() => setActiveItem(item.id)}>
                    <MockItem 
                        name={item.name} 
                        count={item.count} 
                        isActive={activeItem === item.id} 
                    />
                </div>
            ))}
        </div>
    );
};
```

## Существующие mock-компоненты (переиспользуй)

| Файл | Компоненты |
|------|------------|
| `PostCardMocks.tsx` | `MockPostCard`, `ImageGridMock`, `TextMock`, `ActionIcon`, `StatusTable` |
| `SidebarMocks.tsx` | `MockProjectListItem`, `MockSidebarList`, `InteractiveSidebarHeader`, `InteractiveFilterPanel` |

## Готовые разделы (примеры для изучения)

| Файл | Что показывает |
|------|----------------|
| `PostCardDeepDive.tsx` | Drag-and-drop песочница, раскрытие текста, модальные окна |
| `SidebarNavDeepDive.tsx` | Счётчики с цветами, интерактивные фильтры, описания состояний |
