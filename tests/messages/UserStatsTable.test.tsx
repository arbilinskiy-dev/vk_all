/**
 * Тесты: UserStatsTable — таблица действий сотрудников.
 * Проверяем: пустые данные, заголовки, данные сотрудников, ролевые бейджи, форматирование дат.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserStatsTable } from '../../features/messages/components/stats/UserStatsTable';
import { AmUserStat } from '../../services/api/am_analysis.api';

const mockUsers: AmUserStat[] = [
    {
        user_id: 'u1',
        username: 'admin',
        full_name: 'Анна Админова',
        role_name: 'Администратор',
        role_color: '#6366f1',
        total_actions: 100,
        dialogs_read: 50,
        unread_dialogs_read: 30,
        messages_sent: 20,
        mark_unread: 5,
        toggle_important: 3,
        labels: 15,
        templates: 5,
        promocodes: 2,
        last_action_at: '2026-03-01T12:00:00',
    },
    {
        user_id: 'u2',
        username: 'noname',
        full_name: null,
        role_name: null,
        role_color: null,
        total_actions: 40,
        dialogs_read: 20,
        unread_dialogs_read: 10,
        messages_sent: 8,
        mark_unread: 0,
        toggle_important: 0,
        labels: 0,
        templates: 0,
        promocodes: 0,
        last_action_at: null,
    },
];

describe('UserStatsTable', () => {

    // === Пустые данные ===

    it('отображает «Нет данных» при пустом массиве', () => {
        render(<UserStatsTable users={[]} />);
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    // === Заголовки таблицы ===

    it('рендерит заголовки колонок таблицы', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByText('Сотрудник')).toBeInTheDocument();
        expect(screen.getByText('Роль')).toBeInTheDocument();
        expect(screen.getByText('Всего')).toBeInTheDocument();
        expect(screen.getByText('Последнее')).toBeInTheDocument();
    });

    it('рендерит заголовки с title (tooltip)', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByTitle('Входы в диалоги')).toBeInTheDocument();
        expect(screen.getByTitle('Прочтение непрочитанных диалогов')).toBeInTheDocument();
        expect(screen.getByTitle('Отправка сообщений')).toBeInTheDocument();
        expect(screen.getByTitle('Пометка как непрочитанное')).toBeInTheDocument();
        expect(screen.getByTitle('Пометка как важное')).toBeInTheDocument();
        expect(screen.getByTitle('Действия с метками')).toBeInTheDocument();
        expect(screen.getByTitle('Действия с шаблонами')).toBeInTheDocument();
        expect(screen.getByTitle('Действия с промокодами')).toBeInTheDocument();
    });

    // === Данные сотрудников ===

    it('отображает ФИО и username сотрудника', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByText('Анна Админова')).toBeInTheDocument();
        expect(screen.getByText('@admin')).toBeInTheDocument();
    });

    it('отображает username при отсутствии full_name', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByText('noname')).toBeInTheDocument();
    });

    it('отображает бейдж роли', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByText('Администратор')).toBeInTheDocument();
    });

    it('отображает «—» при отсутствии роли', () => {
        render(<UserStatsTable users={mockUsers} />);
        // У второго пользователя role_name=null → «—»
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('отображает total_actions', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('отображает dialogs_read', () => {
        render(<UserStatsTable users={mockUsers} />);
        expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('отображает «—» для нулевых значений', () => {
        render(<UserStatsTable users={mockUsers} />);
        // У второго пользователя mark_unread=0, toggle_important=0 и т.д. → «—»
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThanOrEqual(5); // минимум 5 «—» от нулевых полей + null-роль + null-дата
    });

    it('форматирует дату последнего действия', () => {
        render(<UserStatsTable users={mockUsers} />);
        // last_action_at='2026-03-01T12:00:00' → '01.03.2026, 12:00'
        const dateText = screen.getByText(/01\.03\.2026/);
        expect(dateText).toBeInTheDocument();
    });

    it('отображает «—» при отсутствии last_action_at', () => {
        render(<UserStatsTable users={mockUsers} />);
        // У второго last_action_at=null → «—»
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    // === Стилизация бейджа роли ===

    it('применяет цвет роли к бейджу', () => {
        render(<UserStatsTable users={mockUsers} />);
        const badge = screen.getByText('Администратор');
        // Проверяем inline-стили
        expect(badge.style.color).toBe('rgb(99, 102, 241)'); // #6366f1
    });

    // === Количество строк ===

    it('рендерит строки по количеству пользователей', () => {
        const { container } = render(<UserStatsTable users={mockUsers} />);
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(2);
    });

    it('рендерит одного пользователя', () => {
        const { container } = render(<UserStatsTable users={[mockUsers[0]]} />);
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(1);
    });
});
