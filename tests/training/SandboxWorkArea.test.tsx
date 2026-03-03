// Тесты компонента SandboxWorkArea
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SandboxWorkArea } from '../../features/training/components/content/section2/content-management-overview/SandboxWorkArea';

describe('SandboxWorkArea', () => {
    it('рендерится без ошибок', () => {
        render(<SandboxWorkArea activeTab="schedule" />);
        expect(screen.getByText('Календарь отложенных постов')).toBeInTheDocument();
    });

    it('показывает календарь при вкладке "schedule"', () => {
        render(<SandboxWorkArea activeTab="schedule" />);
        expect(screen.getByText('Календарь отложенных постов')).toBeInTheDocument();
        // Проверяем наличие дней недели
        expect(screen.getByText('Пн')).toBeInTheDocument();
        expect(screen.getByText('Вт')).toBeInTheDocument();
        expect(screen.getByText('Ср')).toBeInTheDocument();
    });

    it('показывает список предложенных постов при вкладке "suggested"', () => {
        render(<SandboxWorkArea activeTab="suggested" />);
        expect(screen.getByText('Список предложенных постов')).toBeInTheDocument();
        // Проверяем наличие авторов
        expect(screen.getByText('Анна Белова')).toBeInTheDocument();
        expect(screen.getByText('Иван Смирнов')).toBeInTheDocument();
    });

    it('показывает таблицу товаров при вкладке "products"', () => {
        render(<SandboxWorkArea activeTab="products" />);
        expect(screen.getByText('Таблица товаров')).toBeInTheDocument();
        // Проверяем заголовки таблицы
        expect(screen.getByText('Название')).toBeInTheDocument();
        expect(screen.getByText('Цена')).toBeInTheDocument();
        expect(screen.getByText('SKU')).toBeInTheDocument();
    });

    it('не показывает контент других вкладок', () => {
        render(<SandboxWorkArea activeTab="schedule" />);
        expect(screen.queryByText('Список предложенных постов')).not.toBeInTheDocument();
        expect(screen.queryByText('Таблица товаров')).not.toBeInTheDocument();
    });
});
