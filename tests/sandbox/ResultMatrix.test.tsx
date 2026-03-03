/**
 * Тесты компонента ResultMatrix — матрица совместимости метод × токен.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultMatrix } from '../../features/sandbox/components/tests/test2-stories-data/ResultMatrix';

// ─── Фикстуры ──────────────────────────────────────────

/** Матрица с разными состояниями ячеек */
const matrix: Record<string, Record<string, any>> = {
    'stories.get': {
        user: { success: true, skipped: false, error_code: null, error_msg: null, elapsed_ms: 120 },
        user_non_admin: { success: true, skipped: false, error_code: null, error_msg: null, elapsed_ms: 95 },
        community: { success: false, skipped: false, error_code: 15, error_msg: 'Access denied: no access to call this method', elapsed_ms: 45 },
        service: { success: false, skipped: true, error_code: null, error_msg: null, elapsed_ms: 0 },
    },
    'stories.getStats': {
        user: { success: true, skipped: false, error_code: null, error_msg: null, elapsed_ms: 200 },
        user_non_admin: null, // нет данных
        community: { success: false, skipped: false, error_code: 30, error_msg: 'This profile is private', elapsed_ms: 60 },
        service: { success: false, skipped: true, error_code: null, error_msg: null, elapsed_ms: 0 },
    },
};

/** Пустая матрица */
const emptyMatrix: Record<string, Record<string, any>> = {};

// ─── Тесты ──────────────────────────────────────────────

describe('ResultMatrix', () => {
    describe('базовый рендер', () => {
        it('рендерит заголовки столбцов (4 типа токенов)', () => {
            render(<ResultMatrix matrix={matrix} />);
            expect(screen.getByText(/User \(админ\)/)).toBeInTheDocument();
            expect(screen.getByText(/User \(не админ\)/)).toBeInTheDocument();
            expect(screen.getByText(/Community Token/)).toBeInTheDocument();
            expect(screen.getByText(/Service Token/)).toBeInTheDocument();
        });

        it('рендерит заголовок "Метод"', () => {
            render(<ResultMatrix matrix={matrix} />);
            expect(screen.getByText('Метод')).toBeInTheDocument();
        });

        it('рендерит имена методов в строках', () => {
            render(<ResultMatrix matrix={matrix} />);
            expect(screen.getByText('stories.get')).toBeInTheDocument();
            expect(screen.getByText('stories.getStats')).toBeInTheDocument();
        });
    });

    describe('ячейки матрицы', () => {
        it('успешная ячейка — отображает ✅ OK', () => {
            render(<ResultMatrix matrix={matrix} />);
            // По крайней мере 2 успешных ячейки (stories.get/user, stories.get/user_non_admin, stories.getStats/user)
            const okCells = screen.getAllByText('✅ OK');
            expect(okCells.length).toBeGreaterThanOrEqual(2);
        });

        it('ячейка с ошибкой — отображает ❌ Ошибка', () => {
            render(<ResultMatrix matrix={matrix} />);
            const errorCells = screen.getAllByText('❌ Ошибка');
            expect(errorCells.length).toBeGreaterThanOrEqual(1);
        });

        it('пропущенная ячейка — отображает ⏭ Пропущен', () => {
            render(<ResultMatrix matrix={matrix} />);
            const skipped = screen.getAllByText('⏭ Пропущен');
            expect(skipped.length).toBeGreaterThanOrEqual(1);
        });

        it('ячейка без данных (null) — отображает "—"', () => {
            render(<ResultMatrix matrix={matrix} />);
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThanOrEqual(1);
        });

        it('ячейка с ошибкой показывает код ошибки', () => {
            render(<ResultMatrix matrix={matrix} />);
            expect(screen.getByText('Код 15')).toBeInTheDocument();
        });

        it('ячейка с ошибкой показывает текст ошибки', () => {
            render(<ResultMatrix matrix={matrix} />);
            expect(screen.getByText(/Access denied/)).toBeInTheDocument();
        });

        it('успешная ячейка показывает время выполнения', () => {
            render(<ResultMatrix matrix={matrix} />);
            expect(screen.getByText('120ms')).toBeInTheDocument();
        });
    });

    describe('пустая матрица', () => {
        it('рендерится без ошибок', () => {
            const { container } = render(<ResultMatrix matrix={emptyMatrix} />);
            // Таблица есть, но строк данных нет
            expect(container.querySelector('table')).toBeInTheDocument();
            expect(container.querySelector('tbody')).toBeInTheDocument();
        });

        it('не содержит строк методов', () => {
            const { container } = render(<ResultMatrix matrix={emptyMatrix} />);
            const rows = container.querySelectorAll('tbody tr');
            expect(rows).toHaveLength(0);
        });
    });
});
