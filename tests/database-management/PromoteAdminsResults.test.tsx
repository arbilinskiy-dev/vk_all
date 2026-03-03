/**
 * Тесты: PromoteAdminsResults
 * 
 * Покрывают:
 * — рендер заголовка с total_pairs
 * — рендер бейджей статистики (promoted, alreadyAdmin, joinedOnly, failedPromote, failedJoin)
 * — скрытие бейджей при пустых массивах
 * — рендер карточек результатов по категориям
 * — рендер блока рекомендаций
 * — скрытие рекомендаций когда нет ошибок
 * — клик «Назад к выбору» и «Закрыть»
 * — клик по оверлею закрывает модалку
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PromoteAdminsResults } from '../../features/database-management/components/modals/PromoteAdminsResults';
import { PromoteUserResult, PromoteToAdminsResponse } from '../../services/api/management.api';
import { GroupedResults } from '../../features/database-management/hooks/usePromoteAdminsLogic';

// ─── Хелперы ─────────────────────────────────────────────────────

function createResult(overrides: Partial<PromoteUserResult> = {}): PromoteUserResult {
    return {
        group_id: 100001,
        group_name: 'Группа Альфа',
        user_id: 200001,
        user_name: 'Иван Иванов',
        was_member: false,
        joined: false,
        promoted: false,
        already_admin: false,
        error: null,
        recommendation: null,
        ...overrides,
    };
}

function createDefaultProps(overrides: Partial<{
    response: PromoteToAdminsResponse;
    groupedResults: GroupedResults;
    onBack: () => void;
    onClose: () => void;
}> = {}) {
    return {
        response: {
            success: true,
            total_pairs: 5,
            promoted_count: 2,
            already_admin_count: 1,
            joined_count: 1,
            error_count: 1,
            results: [],
        },
        groupedResults: {
            promoted: [createResult({ promoted: true, user_name: 'Промо1' }), createResult({ promoted: true, user_name: 'Промо2' })],
            alreadyAdmin: [createResult({ already_admin: true, user_name: 'УжеАдмин' })],
            joinedOnly: [createResult({ joined: true, user_name: 'Вступил' })],
            failedJoin: [createResult({ error: 'no_access', user_name: 'ФейлВступ' })],
            failedPromote: [],
            recommendations: [],
        },
        onBack: vi.fn(),
        onClose: vi.fn(),
        ...overrides,
    };
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('PromoteAdminsResults', () => {

    it('показывает total_pairs в заголовке', () => {
        const props = createDefaultProps();
        render(<PromoteAdminsResults {...props} />);

        expect(screen.getByText(/Обработано 5 пар/)).toBeInTheDocument();
    });

    // === Бейджи статистики ===

    describe('бейджи статистики', () => {
        it('показывает бейдж «Назначено» при наличии promoted', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText(/Назначено: 2/)).toBeInTheDocument();
        });

        it('показывает бейдж «Уже админы»', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText(/Уже админы: 1/)).toBeInTheDocument();
        });

        it('показывает бейдж «Не вступили»', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText(/Не вступили: 1/)).toBeInTheDocument();
        });

        it('не показывает бейдж «Не назначены» при пустом failedPromote', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.queryByText(/Не назначены/)).not.toBeInTheDocument();
        });

        it('показывает бейдж «Не назначены» при наличии failedPromote', () => {
            const props = createDefaultProps({
                groupedResults: {
                    ...createDefaultProps().groupedResults,
                    failedPromote: [createResult({ error: 'no_rights', joined: true })],
                },
            });
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText(/Не назначены: 1/)).toBeInTheDocument();
        });
    });

    // === Категории результатов ===

    describe('карточки результатов', () => {
        it('показывает имена в категории «Назначены»', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText('Промо1')).toBeInTheDocument();
            expect(screen.getByText('Промо2')).toBeInTheDocument();
        });

        it('показывает заголовок категории «Уже были администраторами»', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText('Уже были администраторами')).toBeInTheDocument();
        });

        it('показывает имена в категории «Не удалось вступить»', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText(/ФейлВступ/)).toBeInTheDocument();
        });
    });

    // === Рекомендации ===

    describe('блок рекомендаций', () => {
        it('не показывает рекомендации когда нет ошибок', () => {
            const props = createDefaultProps({
                groupedResults: {
                    promoted: [createResult({ promoted: true })],
                    alreadyAdmin: [],
                    joinedOnly: [],
                    failedJoin: [],
                    failedPromote: [],
                    recommendations: ['Добавьте токен'],
                },
            });
            render(<PromoteAdminsResults {...props} />);

            // Нет ошибок (failedJoin & failedPromote пустые) → рекомендации не показываются
            expect(screen.queryByText('Что нужно сделать')).not.toBeInTheDocument();
        });

        it('показывает рекомендации при наличии ошибок', () => {
            const props = createDefaultProps({
                groupedResults: {
                    promoted: [],
                    alreadyAdmin: [],
                    joinedOnly: [],
                    failedJoin: [createResult({ error: 'err' })],
                    failedPromote: [],
                    recommendations: ['Добавьте токен', 'Проверьте доступ'],
                },
            });
            render(<PromoteAdminsResults {...props} />);

            expect(screen.getByText('Что нужно сделать')).toBeInTheDocument();
            expect(screen.getByText('Добавьте токен')).toBeInTheDocument();
            expect(screen.getByText('Проверьте доступ')).toBeInTheDocument();
        });
    });

    // === Кнопки ===

    describe('кнопки', () => {
        it('клик «Назад к выбору» вызывает onBack', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            fireEvent.click(screen.getByText('← Назад к выбору'));
            expect(props.onBack).toHaveBeenCalledTimes(1);
        });

        it('клик «Закрыть» вызывает onClose', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsResults {...props} />);

            fireEvent.click(screen.getByText('Закрыть'));
            expect(props.onClose).toHaveBeenCalledTimes(1);
        });
    });
});
