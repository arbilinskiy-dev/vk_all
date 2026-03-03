/**
 * Тесты: ChatMessage
 * Проверяем рендер сообщения в чате:
 * — входящие vs исходящие (стилизация)
 * — текст, время, статус прочтения
 * — подсветка поиска
 * — скрытие вложений/кнопок через displayFilters
 * — стикер без бабла
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatMessage } from '../../features/messages/components/chat/ChatMessage';
import { ChatMessageData, ChatDisplayFilters } from '../../features/messages/types';

/** Хелпер: создание мок-сообщения */
function createMessage(overrides: Partial<ChatMessageData> = {}): ChatMessageData {
    return {
        id: 'msg-1',
        direction: 'incoming',
        text: 'Привет! Как дела?',
        timestamp: '2026-02-24T12:00:00.000Z',
        isRead: true,
        ...overrides,
    };
}

/** Дефолтные фильтры */
const defaultFilters: ChatDisplayFilters = { hideAttachments: false, hideKeyboard: false };

describe('ChatMessage', () => {
    // === Базовый рендер ===
    it('отображает текст сообщения', () => {
        render(<ChatMessage message={createMessage()} />);
        expect(screen.getByText('Привет! Как дела?')).toBeInTheDocument();
    });

    it('отображает время сообщения', () => {
        render(<ChatMessage message={createMessage()} />);
        // Время зависит от часового пояса, проверяем наличие цифр формата HH:MM
        const timeElements = screen.getAllByText(/\d{2}:\d{2}/);
        expect(timeElements.length).toBeGreaterThan(0);
    });

    // === Направление ===
    it('рендерит входящее сообщение align-left (justify-start)', () => {
        const { container } = render(<ChatMessage message={createMessage({ direction: 'incoming' })} />);
        const wrapper = container.firstElementChild;
        expect(wrapper?.className).toContain('justify-start');
    });

    it('рендерит исходящее сообщение align-right (justify-end)', () => {
        const { container } = render(<ChatMessage message={createMessage({ direction: 'outgoing' })} />);
        const wrapper = container.firstElementChild;
        expect(wrapper?.className).toContain('justify-end');
    });

    // === Стилизация бабла ===
    it('применяет bg-indigo-600 к исходящим сообщениям', () => {
        const { container } = render(<ChatMessage message={createMessage({ direction: 'outgoing' })} />);
        const bubble = container.querySelector('.bg-indigo-600');
        expect(bubble).toBeInTheDocument();
    });

    it('применяет bg-gray-100 к входящим сообщениям', () => {
        const { container } = render(<ChatMessage message={createMessage({ direction: 'incoming' })} />);
        const bubble = container.querySelector('.bg-gray-100');
        expect(bubble).toBeInTheDocument();
    });

    // === Статус прочтения ===
    it('показывает индикатор «Прочитано» для исходящих прочитанных', () => {
        render(<ChatMessage message={createMessage({ direction: 'outgoing', isRead: true })} />);
        expect(screen.getByTitle('Прочитано')).toBeInTheDocument();
    });

    it('показывает индикатор «Отправлено» для исходящих непрочитанных', () => {
        render(<ChatMessage message={createMessage({ direction: 'outgoing', isRead: false })} />);
        expect(screen.getByTitle('Отправлено')).toBeInTheDocument();
    });

    it('НЕ показывает статус прочтения для входящих', () => {
        render(<ChatMessage message={createMessage({ direction: 'incoming' })} />);
        expect(screen.queryByTitle('Прочитано')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Отправлено')).not.toBeInTheDocument();
    });

    // === Подсветка поиска ===
    it('подсвечивает совпадения при searchQuery', () => {
        const { container } = render(
            <ChatMessage message={createMessage({ text: 'Тестовый текст для поиска' })} searchQuery="текст" />
        );
        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('текст');
    });

    it('НЕ подсвечивает при пустом searchQuery', () => {
        const { container } = render(
            <ChatMessage message={createMessage({ text: 'Тестовый текст' })} searchQuery="" />
        );
        expect(container.querySelectorAll('mark').length).toBe(0);
    });

    // === Фильтры отображения ===
    it('скрывает вложения при hideAttachments=true и показывает индикатор', () => {
        const msg = createMessage({
            attachments: [{ type: 'photo', url: 'https://example.com/photo.jpg' }],
        });
        render(
            <ChatMessage
                message={msg}
                displayFilters={{ hideAttachments: true, hideKeyboard: false }}
            />
        );
        // Индикатор скрытого вложения
        expect(screen.getByText('1 влож.')).toBeInTheDocument();
    });

    it('скрывает кнопки бота при hideKeyboard=true', () => {
        const msg = createMessage({
            keyboard: {
                inline: true,
                buttons: [[{ action: { type: 'text', label: 'Кнопка 1' }, color: 'primary' }]],
            },
        });
        render(
            <ChatMessage
                message={msg}
                displayFilters={{ hideAttachments: false, hideKeyboard: true }}
            />
        );
        // Кнопка не рендерится, зато есть индикатор «кнопки»
        expect(screen.queryByText('Кнопка 1')).not.toBeInTheDocument();
        expect(screen.getByText('кнопки')).toBeInTheDocument();
    });

    // === Стикер без бабла ===
    it('рендерит стикер без бабла (без bg-indigo)', () => {
        const msg = createMessage({
            direction: 'outgoing',
            text: '',
            attachments: [{ type: 'sticker', url: 'https://example.com/sticker.png', previewUrl: 'https://example.com/sticker.png' }],
        });
        const { container } = render(<ChatMessage message={msg} />);
        // Стикер рендерится без бабла → нет .bg-indigo-600 (бабл исходящего) и нет .rounded-2xl (бабл)
        expect(container.querySelector('.bg-indigo-600')).not.toBeInTheDocument();
        // Стикер рендерится в обёртке без скруглённого бабла
        expect(container.querySelector('.rounded-2xl')).not.toBeInTheDocument();
    });

    // === Пустое сообщение с вложением ===
    it('рендерит вложение без текста', () => {
        const msg = createMessage({
            text: '',
            attachments: [{ type: 'document', url: 'https://example.com/doc.pdf', name: 'Документ.pdf' }],
        });
        render(<ChatMessage message={msg} displayFilters={defaultFilters} />);
        expect(screen.getByText('Документ.pdf')).toBeInTheDocument();
    });
});
