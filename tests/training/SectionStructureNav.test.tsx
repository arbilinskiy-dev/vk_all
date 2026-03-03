// Тесты компонента SectionStructureNav
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionStructureNav } from '../../features/training/components/content/section2/content-management-overview/SectionStructureNav';

describe('SectionStructureNav', () => {
    it('рендерится без ошибок', () => {
        render(<SectionStructureNav />);
        expect(screen.getByText('Структура раздела')).toBeInTheDocument();
    });

    it('отображает все 4 подраздела', () => {
        render(<SectionStructureNav />);
        expect(screen.getByText(/Вкладка "Отложенные"/)).toBeInTheDocument();
        expect(screen.getByText(/Вкладка "Предложенные"/)).toBeInTheDocument();
        expect(screen.getByText(/Вкладка "Товары"/)).toBeInTheDocument();
        expect(screen.getByText(/Автоматизации/)).toBeInTheDocument();
    });

    it('отображает вложенные пункты для раздела "Отложенные"', () => {
        render(<SectionStructureNav />);
        expect(screen.getByText(/Сайдбар проектов/)).toBeInTheDocument();
        expect(screen.getByText(/Шапка календаря/)).toBeInTheDocument();
        expect(screen.getByText(/Сетка календаря/)).toBeInTheDocument();
        expect(screen.getByText(/Модальное окно поста/)).toBeInTheDocument();
    });

    it('отображает вложенные пункты для раздела "Автоматизации"', () => {
        render(<SectionStructureNav />);
        expect(screen.getByText(/Посты в истории/)).toBeInTheDocument();
        expect(screen.getByText(/Конкурс отзывов/)).toBeInTheDocument();
        expect(screen.getByText(/Дроп промокодов/)).toBeInTheDocument();
    });

    it('содержит совет для пользователя', () => {
        render(<SectionStructureNav />);
        expect(screen.getByText(/Начни с раздела 2\.1/)).toBeInTheDocument();
    });
});
