// Тесты компонента CapabilitiesList
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilitiesList } from '../../features/training/components/content/section2/content-management-overview/CapabilitiesList';

describe('CapabilitiesList', () => {
    it('рендерится без ошибок', () => {
        render(<CapabilitiesList />);
        expect(screen.getByText('Что ты сможешь делать?')).toBeInTheDocument();
    });

    it('отображает все 4 возможности', () => {
        render(<CapabilitiesList />);
        expect(screen.getByText('Планировать публикации')).toBeInTheDocument();
        expect(screen.getByText('Работать с предложенными постами')).toBeInTheDocument();
        expect(screen.getByText('Управлять товарами')).toBeInTheDocument();
        expect(screen.getByText('Быстро переключаться между проектами')).toBeInTheDocument();
    });

    it('содержит описание для каждой возможности', () => {
        render(<CapabilitiesList />);
        expect(screen.getByText(/системные черновики/)).toBeInTheDocument();
        expect(screen.getByText(/AI-редактор/)).toBeInTheDocument();
        expect(screen.getByText(/Редактировать товары сообщества/)).toBeInTheDocument();
        expect(screen.getByText(/сайдбар для мгновенного переключения/)).toBeInTheDocument();
    });
});
