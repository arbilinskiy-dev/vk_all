// Тесты компонента ModuleComponentsInfo
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleComponentsInfo } from '../../features/training/components/content/section2/content-management-overview/ModuleComponentsInfo';

describe('ModuleComponentsInfo', () => {
    it('рендерится без ошибок', () => {
        render(<ModuleComponentsInfo />);
        expect(screen.getByText('Основные компоненты модуля')).toBeInTheDocument();
    });

    it('отображает описание двух главных частей', () => {
        render(<ModuleComponentsInfo />);
        expect(screen.getByText(/Сайдбар проектов/)).toBeInTheDocument();
        expect(screen.getByText(/Рабочая область/)).toBeInTheDocument();
    });

    it('содержит пояснение о двух колонках', () => {
        render(<ModuleComponentsInfo />);
        expect(screen.getByText(/двух главных частей/)).toBeInTheDocument();
        expect(screen.getByText(/вторая колонка/)).toBeInTheDocument();
        expect(screen.getByText(/третья колонка/)).toBeInTheDocument();
    });
});
