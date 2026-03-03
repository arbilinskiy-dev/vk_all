// Тесты компонента SandboxNavColumn
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SandboxNavColumn } from '../../features/training/components/content/section2/content-management-overview/SandboxNavColumn';
import { ActiveTab } from '../../features/training/components/content/section2/content-management-overview/types';

// Хелпер для создания дефолтных пропсов
const createDefaultProps = (overrides?: Partial<{
    activeTab: ActiveTab;
    automationsOpen: boolean;
    setActiveTab: (tab: ActiveTab) => void;
    setAutomationsOpen: (open: boolean) => void;
}>) => ({
    activeTab: 'schedule' as ActiveTab,
    automationsOpen: false,
    setActiveTab: vi.fn(),
    setAutomationsOpen: vi.fn(),
    ...overrides,
});

describe('SandboxNavColumn', () => {
    it('рендерится без ошибок', () => {
        const props = createDefaultProps();
        render(<SandboxNavColumn {...props} />);
        expect(screen.getByText('Контент')).toBeInTheDocument();
    });

    it('отображает все вкладки навигации', () => {
        const props = createDefaultProps();
        render(<SandboxNavColumn {...props} />);
        expect(screen.getByText('Отложенные')).toBeInTheDocument();
        expect(screen.getByText('Предложенные')).toBeInTheDocument();
        expect(screen.getByText('Товары')).toBeInTheDocument();
        expect(screen.getByText('Автоматизации')).toBeInTheDocument();
    });

    it('вызывает setActiveTab при клике на вкладку "Предложенные"', () => {
        const setActiveTab = vi.fn();
        const props = createDefaultProps({ setActiveTab });
        render(<SandboxNavColumn {...props} />);

        fireEvent.click(screen.getByText('Предложенные'));
        expect(setActiveTab).toHaveBeenCalledWith('suggested');
    });

    it('вызывает setActiveTab при клике на вкладку "Товары"', () => {
        const setActiveTab = vi.fn();
        const props = createDefaultProps({ setActiveTab });
        render(<SandboxNavColumn {...props} />);

        fireEvent.click(screen.getByText('Товары'));
        expect(setActiveTab).toHaveBeenCalledWith('products');
    });

    it('вызывает setAutomationsOpen при клике на "Автоматизации"', () => {
        const setAutomationsOpen = vi.fn();
        const props = createDefaultProps({ automationsOpen: false, setAutomationsOpen });
        render(<SandboxNavColumn {...props} />);

        fireEvent.click(screen.getByText('Автоматизации'));
        expect(setAutomationsOpen).toHaveBeenCalledWith(true);
    });

    it('не показывает подразделы автоматизаций, когда automationsOpen=false', () => {
        const props = createDefaultProps({ automationsOpen: false });
        render(<SandboxNavColumn {...props} />);
        expect(screen.queryByText('Посты в истории')).not.toBeInTheDocument();
    });

    it('показывает подразделы автоматизаций, когда automationsOpen=true', () => {
        const props = createDefaultProps({ automationsOpen: true });
        render(<SandboxNavColumn {...props} />);
        expect(screen.getByText('Посты в истории')).toBeInTheDocument();
        expect(screen.getByText('Конкурс отзывов')).toBeInTheDocument();
        expect(screen.getByText('Дроп промокодов')).toBeInTheDocument();
        expect(screen.getByText('Конкурсы')).toBeInTheDocument();
        expect(screen.getByText('AI посты')).toBeInTheDocument();
        expect(screen.getByText('С др')).toBeInTheDocument();
        expect(screen.getByText('Конкурс Актив')).toBeInTheDocument();
    });
});
