/**
 * Тесты хаб-компонента StoriesDataTest — форма управления тестом историй VK API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoriesDataTest } from '../../features/sandbox/components/tests/test2-stories-data/StoriesDataTest';

// ─── Мок shared/config ──────────────────────────────────

vi.mock('../../shared/config', () => ({
    API_BASE_URL: 'http://localhost:8000/api',
}));

// ─── Мок fetch ──────────────────────────────────────────

const mockFetch = vi.fn();

beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = mockFetch;
    mockFetch.mockReset();
});

// ─── Тесты ──────────────────────────────────────────────

describe('StoriesDataTest (хаб-компонент)', () => {
    describe('базовый рендер', () => {
        it('отображает заголовок теста', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText('Тест 2: Получение данных историй')).toBeInTheDocument();
        });

        it('отображает описание теста', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText(/stories\.get \/ getStats \/ getViewers/)).toBeInTheDocument();
        });

        it('отображает кнопку "Сбросить всё"', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText('Сбросить всё')).toBeInTheDocument();
        });

        it('отображает секцию "Токены"', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText(/Токены \(укажите один или несколько\)/)).toBeInTheDocument();
        });

        it('отображает секцию "Параметры"', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText('Параметры')).toBeInTheDocument();
        });

        it('отображает секцию "Режим запуска"', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText('Режим запуска')).toBeInTheDocument();
        });
    });

    describe('поля ввода токенов', () => {
        it('отображает input для User Token', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText(/vk1\.a\.xxx.*токен администратора/)).toBeInTheDocument();
        });

        it('отображает input для User Non-Admin Token', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText(/не админ сообщества/)).toBeInTheDocument();
        });

        it('отображает input для Community Token', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText(/Ключ доступа сообщества/)).toBeInTheDocument();
        });

        it('отображает input для Service Token', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText(/Сервисный ключ приложения/)).toBeInTheDocument();
        });
    });

    describe('поля параметров', () => {
        it('отображает поле ID группы', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText('123456789')).toBeInTheDocument();
        });

        it('отображает поле Story ID', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText('ID конкретной истории')).toBeInTheDocument();
        });

        it('отображает поле Viewers count', () => {
            render(<StoriesDataTest />);
            expect(screen.getByPlaceholderText('10')).toBeInTheDocument();
        });
    });

    describe('переключение режимов', () => {
        it('по умолчанию выбран режим "Один метод"', () => {
            render(<StoriesDataTest />);
            const singleRadio = screen.getByLabelText('Один метод × все токены');
            expect(singleRadio).toBeChecked();
        });

        it('можно переключить на режим "Все методы"', () => {
            render(<StoriesDataTest />);
            const allRadio = screen.getByLabelText('Все методы × все токены (матрица)');
            fireEvent.click(allRadio);
            expect(allRadio).toBeChecked();
        });

        it('в режиме single отображаются кнопки выбора метода', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText('stories.get', { selector: 'span' })).toBeInTheDocument();
            expect(screen.getByText('stories.getStats', { selector: 'span' })).toBeInTheDocument();
            expect(screen.getByText('stories.getViewers', { selector: 'span' })).toBeInTheDocument();
            expect(screen.getByText('Зрители (детали)', { selector: 'span' })).toBeInTheDocument();
        });

        it('переключение на "все методы" скрывает кнопки выбора метода', () => {
            render(<StoriesDataTest />);
            const allRadio = screen.getByLabelText('Все методы × все токены (матрица)');
            fireEvent.click(allRadio);
            // Описание метода stories.get не должно быть в секции выбора
            expect(screen.queryByText('Получение списка активных историй сообщества')).not.toBeInTheDocument();
        });

        it('в режиме single отображается описание выбранного метода', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText('Получение списка активных историй сообщества')).toBeInTheDocument();
        });
    });

    describe('кнопка запуска', () => {
        it('в режиме single отображает текст "Тестировать stories.get"', () => {
            render(<StoriesDataTest />);
            expect(screen.getByText(/🚀 Тестировать stories\.get/)).toBeInTheDocument();
        });

        it('в режиме all отображает текст "Запустить полный тест"', () => {
            render(<StoriesDataTest />);
            const allRadio = screen.getByLabelText('Все методы × все токены (матрица)');
            fireEvent.click(allRadio);
            expect(screen.getByText(/🚀 Запустить полный тест/)).toBeInTheDocument();
        });
    });

    describe('кнопка "Сбросить всё"', () => {
        it('при клике очищает поле Group ID', () => {
            render(<StoriesDataTest />);
            const groupInput = screen.getByPlaceholderText('123456789') as HTMLInputElement;
            fireEvent.change(groupInput, { target: { value: '999' } });
            expect(groupInput.value).toBe('999');

            fireEvent.click(screen.getByText('Сбросить всё'));
            expect(groupInput.value).toBe('');
        });
    });

    describe('выбор метода', () => {
        it('клик по кнопке метода меняет описание', () => {
            render(<StoriesDataTest />);
            // По умолчанию stories.get
            expect(screen.getByText('Получение списка активных историй сообщества')).toBeInTheDocument();

            // Кликаем на stories.getStats
            const getStatsButton = screen.getByText('stories.getStats', { selector: 'span' }).closest('button')!;
            fireEvent.click(getStatsButton);

            expect(screen.getByText(/Статистика конкретной истории/)).toBeInTheDocument();
        });
    });

    describe('ошибки', () => {
        it('не показывается блок ошибки по умолчанию', () => {
            render(<StoriesDataTest />);
            expect(screen.queryByText(/^Ошибка:/)).not.toBeInTheDocument();
        });
    });
});
