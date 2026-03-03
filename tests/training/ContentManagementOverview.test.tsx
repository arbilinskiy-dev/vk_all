// Тесты хаб-компонента ContentManagementOverview
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentManagementOverview } from '../../features/training/components/content/section2/ContentManagementOverview';

describe('ContentManagementOverview', () => {
    it('рендерится без ошибок с переданным заголовком', () => {
        render(<ContentManagementOverview title="Обзор контент-менеджмента" />);
        expect(screen.getByText('Обзор контент-менеджмента')).toBeInTheDocument();
    });

    it('отображает вводное описание модуля', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText(/центральная часть планировщика/)).toBeInTheDocument();
    });

    it('отображает блок "Главная идея"', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText(/Главная идея:/)).toBeInTheDocument();
    });

    it('содержит секцию "Основные разделы модуля"', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText('Основные разделы модуля')).toBeInTheDocument();
    });

    it('содержит секцию "Как выглядит интерфейс?"', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText('Как выглядит интерфейс?')).toBeInTheDocument();
    });

    it('содержит секцию "Основные компоненты модуля"', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText('Основные компоненты модуля')).toBeInTheDocument();
    });

    it('содержит секцию "Что ты сможешь делать?"', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText('Что ты сможешь делать?')).toBeInTheDocument();
    });

    it('содержит секцию "Структура раздела"', () => {
        render(<ContentManagementOverview title="Тест" />);
        expect(screen.getByText('Структура раздела')).toBeInTheDocument();
    });
});
