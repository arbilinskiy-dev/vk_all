/**
 * Тесты компонента StepCard — карточка одного шага VK API.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepCard } from '../../features/sandbox/components/tests/test2-stories-data/StepCard';
import type { StepLog } from '../../features/sandbox/components/tests/test2-stories-data/useStoriesDataTest';

// ─── Фикстуры ──────────────────────────────────────────

/** Успешный шаг */
const successStep: StepLog = {
    step: 1,
    name: 'stories.get',
    description: 'Получение списка историй',
    success: true,
    request: { owner_id: -123456, count: 10 },
    response: { count: 2, items: [{ id: 1 }, { id: 2 }] },
    http_status: 200,
    elapsed_ms: 150,
    error: null,
};

/** Шаг с ошибкой */
const errorStep: StepLog = {
    step: 2,
    name: 'stories.getStats',
    description: 'Статистика истории',
    success: false,
    request: { owner_id: -123456, story_id: 42 },
    response: null,
    http_status: 403,
    elapsed_ms: 80,
    error: { error_code: 15, error_msg: 'Access denied' },
};

/** Шаг без request и response (минимальный) */
const minimalStep: StepLog = {
    step: 3,
    name: 'stories.getViewers',
    description: 'Зрители',
    success: true,
    request: null,
    response: undefined as any,
    http_status: null,
    elapsed_ms: 0,
    error: null,
};

// ─── Тесты ──────────────────────────────────────────────

describe('StepCard', () => {
    describe('базовый рендер', () => {
        it('отображает имя шага', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            expect(screen.getByText('stories.get')).toBeInTheDocument();
        });

        it('отображает описание шага', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            expect(screen.getByText('Получение списка историй')).toBeInTheDocument();
        });

        it('отображает время выполнения', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            expect(screen.getByText('150ms')).toBeInTheDocument();
        });

        it('отображает статус OK для успешного шага', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            expect(screen.getByText('✓ OK')).toBeInTheDocument();
        });

        it('отображает метку токена User (админ)', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            expect(screen.getByText(/User \(админ\)/)).toBeInTheDocument();
        });
    });

    describe('шаг с ошибкой', () => {
        it('отображает статус "Ошибка"', () => {
            render(<StepCard step={errorStep} tokenType="community" />);
            expect(screen.getByText('✗ Ошибка')).toBeInTheDocument();
        });

        it('отображает метку Community Token', () => {
            render(<StepCard step={errorStep} tokenType="community" />);
            expect(screen.getByText(/Community Token/)).toBeInTheDocument();
        });
    });

    describe('раскрытие/скрытие деталей', () => {
        it('детали скрыты по умолчанию', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            // JSON запроса не виден
            expect(screen.queryByText(/owner_id/)).not.toBeInTheDocument();
        });

        it('клик раскрывает детали — виден запрос', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            // Кликаем по кнопке (заголовку карточки)
            fireEvent.click(screen.getByRole('button'));
            // После раскрытия должен быть виден JSON запроса
            expect(screen.getByText(/→ Запрос \(Request\)/)).toBeInTheDocument();
        });

        it('клик раскрывает детали — виден ответ', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            fireEvent.click(screen.getByRole('button'));
            expect(screen.getByText(/← Ответ \(Response\)/)).toBeInTheDocument();
        });

        it('повторный клик скрывает детали', () => {
            render(<StepCard step={successStep} tokenType="user" />);
            const button = screen.getByRole('button');
            fireEvent.click(button); // раскрыть
            fireEvent.click(button); // скрыть
            expect(screen.queryByText(/→ Запрос \(Request\)/)).not.toBeInTheDocument();
        });

        it('при ошибке виден блок "⚠ Ошибка"', () => {
            render(<StepCard step={errorStep} tokenType="service" />);
            fireEvent.click(screen.getByRole('button'));
            expect(screen.getByText(/⚠ Ошибка/)).toBeInTheDocument();
        });
    });

    describe('разные типы токенов', () => {
        it('user_non_admin — отображает метку "User (не админ)"', () => {
            render(<StepCard step={successStep} tokenType="user_non_admin" />);
            expect(screen.getByText(/User \(не админ\)/)).toBeInTheDocument();
        });

        it('service — отображает метку "Service Token"', () => {
            render(<StepCard step={successStep} tokenType="service" />);
            expect(screen.getByText(/Service Token/)).toBeInTheDocument();
        });

        it('неизвестный тип токена — fallback на user', () => {
            render(<StepCard step={successStep} tokenType="unknown_type" />);
            // Должен fallback на TOKEN_TYPE_LABELS.user
            expect(screen.getByText(/User \(админ\)/)).toBeInTheDocument();
        });
    });

    describe('минимальный шаг (без request/response)', () => {
        it('рендерится без ошибок', () => {
            render(<StepCard step={minimalStep} tokenType="user" />);
            expect(screen.getByText('stories.getViewers')).toBeInTheDocument();
        });

        it('при раскрытии не показывает блок запроса, если request=null', () => {
            render(<StepCard step={minimalStep} tokenType="user" />);
            fireEvent.click(screen.getByRole('button'));
            expect(screen.queryByText(/→ Запрос \(Request\)/)).not.toBeInTheDocument();
        });
    });
});
