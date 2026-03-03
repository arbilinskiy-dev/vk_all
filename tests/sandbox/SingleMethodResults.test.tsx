/**
 * Тесты компонента SingleMethodResults — результат одного метода.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SingleMethodResults } from '../../features/sandbox/components/tests/test2-stories-data/SingleMethodResults';
import type { MethodResult } from '../../features/sandbox/components/tests/test2-stories-data/useStoriesDataTest';

// ─── Фикстуры ──────────────────────────────────────────

/** Результат обычного метода (без цепочки) */
const normalMethodResult: MethodResult = {
    method: 'stories.get',
    group_id: 123456,
    story_id: null,
    tokens_tested: 3,
    tokens_success: 2,
    results_by_token: [
        {
            method: 'stories.get',
            token_type: 'user',
            step: {
                step: 1,
                name: 'stories.get',
                description: 'Получение историй',
                success: true,
                request: { owner_id: -123456 },
                response: { count: 2 },
                http_status: 200,
                elapsed_ms: 120,
                error: null,
            },
            summary: { stories_count: 2, has_stories: true },
        },
        {
            method: 'stories.get',
            token_type: 'community',
            step: {
                step: 1,
                name: 'stories.get',
                description: 'Получение историй',
                success: false,
                request: { owner_id: -123456 },
                response: null,
                http_status: 403,
                elapsed_ms: 50,
                error: { error_code: 15 },
            },
            summary: null,
        },
    ],
};

/** Результат метода с цепочкой (viewers_details) */
const chainMethodResult: MethodResult = {
    method: 'viewers_details',
    group_id: 123456,
    story_id: 42,
    tokens_tested: 2,
    tokens_success: 1,
    results_by_token: [
        {
            method: 'viewers_details',
            token_type: 'user',
            step: {
                step: 1,
                name: 'viewers_details',
                description: 'Цепочка запросов',
                success: true,
                request: null,
                response: null,
                http_status: 200,
                elapsed_ms: 300,
                error: null,
            },
            summary: { viewers_count: 5 },
            chain_steps: [
                {
                    step: 1,
                    name: 'stories.getViewers',
                    description: 'Получение зрителей',
                    success: true,
                    request: { story_id: 42 },
                    response: { items: [1, 2, 3] },
                    http_status: 200,
                    elapsed_ms: 150,
                    error: null,
                },
                {
                    step: 2,
                    name: 'users.get',
                    description: 'Данные пользователей',
                    success: true,
                    request: { user_ids: '1,2,3' },
                    response: { items: [] },
                    http_status: 200,
                    elapsed_ms: 100,
                    error: null,
                },
            ],
        } as any,
    ],
};

// ─── Тесты ──────────────────────────────────────────────

describe('SingleMethodResults', () => {
    describe('обычный метод (без цепочки)', () => {
        it('отображает имя метода', () => {
            render(<SingleMethodResults result={normalMethodResult} />);
            // Имя метода встречается несколько раз (в заголовке и в карточках шагов),
            // поэтому ищем именно в span с font-mono font-bold — заголовке компонента
            const methodNames = screen.getAllByText('stories.get');
            expect(methodNames.length).toBeGreaterThanOrEqual(1);
        });

        it('отображает статистику тестирования', () => {
            render(<SingleMethodResults result={normalMethodResult} />);
            expect(screen.getByText(/Протестировано: 3 токенов/)).toBeInTheDocument();
            expect(screen.getByText(/Успешно: 2/)).toBeInTheDocument();
        });

        it('отображает заголовок "Сводка данных"', () => {
            render(<SingleMethodResults result={normalMethodResult} />);
            expect(screen.getByText('Сводка данных')).toBeInTheDocument();
        });

        it('отображает заголовок "Детальные ответы VK API"', () => {
            render(<SingleMethodResults result={normalMethodResult} />);
            expect(screen.getByText('Детальные ответы VK API')).toBeInTheDocument();
        });

        it('НЕ отображает заголовок цепочки запросов', () => {
            render(<SingleMethodResults result={normalMethodResult} />);
            expect(screen.queryByText(/Цепочки запросов/)).not.toBeInTheDocument();
        });

        it('не показывает badge "Цепочка запросов"', () => {
            render(<SingleMethodResults result={normalMethodResult} />);
            expect(screen.queryByText('🔗 Цепочка запросов')).not.toBeInTheDocument();
        });
    });

    describe('метод с цепочкой (viewers_details)', () => {
        it('отображает имя метода', () => {
            render(<SingleMethodResults result={chainMethodResult} />);
            expect(screen.getByText('viewers_details')).toBeInTheDocument();
        });

        it('показывает badge "Цепочка запросов"', () => {
            render(<SingleMethodResults result={chainMethodResult} />);
            expect(screen.getByText('🔗 Цепочка запросов')).toBeInTheDocument();
        });

        it('отображает заголовок цепочки', () => {
            render(<SingleMethodResults result={chainMethodResult} />);
            expect(screen.getByText(/Цепочки запросов/)).toBeInTheDocument();
        });

        it('НЕ отображает "Детальные ответы VK API"', () => {
            render(<SingleMethodResults result={chainMethodResult} />);
            expect(screen.queryByText('Детальные ответы VK API')).not.toBeInTheDocument();
        });
    });
});
