// Тесты компонента ModuleSectionsCards
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleSectionsCards } from '../../features/training/components/content/section2/content-management-overview/ModuleSectionsCards';

describe('ModuleSectionsCards', () => {
    it('рендерится без ошибок', () => {
        render(<ModuleSectionsCards />);
        expect(screen.getByText('Основные разделы модуля')).toBeInTheDocument();
    });

    it('отображает 4 карточки разделов', () => {
        render(<ModuleSectionsCards />);
        expect(screen.getByText('Отложенные')).toBeInTheDocument();
        expect(screen.getByText('Предложенные')).toBeInTheDocument();
        expect(screen.getByText('Товары')).toBeInTheDocument();
        expect(screen.getByText('Автоматизации')).toBeInTheDocument();
    });

    it('содержит описание для каждой карточки', () => {
        render(<ModuleSectionsCards />);
        // Проверяем ключевые фразы из описаний
        expect(screen.getByText(/запланированы к публикации/)).toBeInTheDocument();
        expect(screen.getByText(/предложили участники сообщества/)).toBeInTheDocument();
        expect(screen.getByText(/Управление товарами/)).toBeInTheDocument();
        expect(screen.getByText(/инструментами автоматизации/)).toBeInTheDocument();
    });

    it('отображает подписи "Основной инструмент" для каждой карточки', () => {
        render(<ModuleSectionsCards />);
        const labels = screen.getAllByText(/Основной инструмент:/);
        expect(labels).toHaveLength(4);
    });
});
