/**
 * Тесты: MessagesEmptyState
 * Проверяем корректный рендер заглушки модуля сообщений:
 * — разные каналы (vk / tg)
 * — состояние «нет проекта» vs «нет диалога»
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessagesEmptyState } from '../../features/messages/components/MessagesEmptyState';

describe('MessagesEmptyState', () => {
    // === Без выбранного проекта ===
    describe('hasProject = false', () => {
        it('отображает заголовок «Сообщения ВКонтакте» для канала vk', () => {
            render(<MessagesEmptyState channel="vk" hasProject={false} />);
            expect(screen.getByText('Сообщения ВКонтакте')).toBeInTheDocument();
        });

        it('отображает заголовок «Сообщения Telegram» для канала tg', () => {
            render(<MessagesEmptyState channel="tg" hasProject={false} />);
            expect(screen.getByText('Сообщения Telegram')).toBeInTheDocument();
        });

        it('показывает подсказку «Выберите проект»', () => {
            render(<MessagesEmptyState channel="vk" hasProject={false} />);
            expect(screen.getByText(/Выберите проект из списка слева/)).toBeInTheDocument();
        });

        it('НЕ показывает «Выберите диалог»', () => {
            render(<MessagesEmptyState channel="vk" hasProject={false} />);
            expect(screen.queryByText('Выберите диалог')).not.toBeInTheDocument();
        });
    });

    // === С проектом, без выбранного диалога ===
    describe('hasProject = true', () => {
        it('отображает заголовок «Выберите диалог»', () => {
            render(<MessagesEmptyState channel="vk" hasProject={true} />);
            expect(screen.getByText('Выберите диалог')).toBeInTheDocument();
        });

        it('показывает подсказку про выбор пользователя', () => {
            render(<MessagesEmptyState channel="vk" hasProject={true} />);
            expect(screen.getByText(/Выберите пользователя из списка диалогов/)).toBeInTheDocument();
        });

        it('НЕ показывает «Сообщения ВКонтакте»', () => {
            render(<MessagesEmptyState channel="vk" hasProject={true} />);
            expect(screen.queryByText('Сообщения ВКонтакте')).not.toBeInTheDocument();
        });
    });

    // === Информационная плашка ===
    describe('информационная плашка', () => {
        it('содержит текст «Работа с сообщениями»', () => {
            render(<MessagesEmptyState channel="vk" hasProject={false} />);
            expect(screen.getByText('Работа с сообщениями')).toBeInTheDocument();
        });

        it('упоминает ВКонтакте для канала vk', () => {
            render(<MessagesEmptyState channel="vk" hasProject={false} />);
            expect(screen.getByText(/синхронизируются с ВКонтакте/)).toBeInTheDocument();
        });

        it('упоминает Telegram для канала tg', () => {
            render(<MessagesEmptyState channel="tg" hasProject={false} />);
            expect(screen.getByText(/синхронизируются с Telegram/)).toBeInTheDocument();
        });
    });

    // === SVG-иконки (без эмодзи) ===
    describe('иконки', () => {
        it('рендерит SVG-иконку для канала vk', () => {
            const { container } = render(<MessagesEmptyState channel="vk" hasProject={false} />);
            // Проверяем наличие SVG (не эмодзи)
            const svgs = container.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThan(0);
        });

        it('рендерит SVG-иконку для канала tg', () => {
            const { container } = render(<MessagesEmptyState channel="tg" hasProject={false} />);
            const svgs = container.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThan(0);
        });
    });
});
