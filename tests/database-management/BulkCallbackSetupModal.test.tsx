/**
 * Тесты: BulkCallbackSetupModal
 * Покрывают весь чеклист из декомпозиции:
 * — открытие/закрытие модалки
 * — бейдж окружения (локалка / сервер)
 * — переключатель SSH Tunnel / Ngrok
 * — проверка tunnel
 * — выбор событий (категории, все/снять)
 * — запуск массовой настройки, прогресс
 * — остановка, итоги, retry ошибок
 * — граничные случаи (нет проектов, клик на оверлей)
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Моки API ────────────────────────────────────────────────────

const mockSetupCallbackAuto = vi.fn();
const mockDetectTunnel = vi.fn();

vi.mock('../../services/api/vk.api', () => ({
    setupCallbackAuto: (...args: any[]) => mockSetupCallbackAuto(...args),
    detectTunnel: (...args: any[]) => mockDetectTunnel(...args),
}));

// ─── Импорт после моков ──────────────────────────────────────────

import { BulkCallbackSetupModal } from '../../features/database-management/components/modals/BulkCallbackSetupModal';
import { Project } from '../../shared/types';
import { ALL_EVENT_KEYS } from '../../shared/utils/callbackEvents';

// ─── Хелперы ─────────────────────────────────────────────────────

/** Создание мок-проекта */
function createProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'proj-1',
        name: 'Тестовый проект',
        communityToken: 'test-token-123',
        vkProjectId: 12345,
        archived: false,
        ...overrides,
    };
}

/** Создание успешного ответа от setupCallbackAuto */
function createSuccessResponse(overrides = {}) {
    return {
        success: true,
        confirmation_code: 'abc123',
        server_name: 'smmitloc',
        server_id: 1,
        callback_url: 'https://example.com/callback',
        action: 'created',
        message: 'Сервер создан',
        ngrok_url: null,
        error_code: null,
        vk_group_short_name: 'testgroup',
        ...overrides,
    };
}

/** Создание ответа с ошибкой */
function createErrorResponse(overrides = {}) {
    return {
        success: false,
        confirmation_code: '',
        server_name: '',
        server_id: 0,
        callback_url: '',
        action: '',
        message: 'Ошибка VK API',
        ngrok_url: null,
        error_code: 100,
        vk_group_short_name: null,
        ...overrides,
    };
}

/** Базовые пропсы модалки */
function createProps(overrides: Partial<React.ComponentProps<typeof BulkCallbackSetupModal>> = {}) {
    return {
        isOpen: true,
        onClose: vi.fn(),
        projects: [
            createProject({ id: 'proj-1', name: 'Проект Альфа' }),
            createProject({ id: 'proj-2', name: 'Проект Бета', vkProjectId: 67890 }),
        ],
        onComplete: vi.fn(),
        ...overrides,
    };
}

// ─── Мок localStorage ────────────────────────────────────────────

const localStorageMock: Record<string, string> = {};

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSetupCallbackAuto.mockReset();
    mockDetectTunnel.mockReset();

    // localStorage mock
    Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]);
    localStorageMock['api_environment'] = 'local';
    localStorageMock['callback_tunnel_mode'] = 'ssh-tunnel';

    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(
        (key: string) => localStorageMock[key] ?? null
    );
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(
        (key: string, value: string) => { localStorageMock[key] = value; }
    );
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

// ─── Тесты ───────────────────────────────────────────────────────

describe('BulkCallbackSetupModal', () => {

    // ==========================================
    //  Открытие / закрытие
    // ==========================================

    describe('Открытие и закрытие', () => {
        it('не рендерит ничего при isOpen=false', () => {
            const { container } = render(<BulkCallbackSetupModal {...createProps({ isOpen: false })} />);
            expect(container.innerHTML).toBe('');
        });

        it('рендерит модалку при isOpen=true', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText('Массовая настройка Callback-серверов')).toBeInTheDocument();
        });

        it('вызывает onClose при клике на крестик в заголовке', () => {
            const onClose = vi.fn();
            render(<BulkCallbackSetupModal {...createProps({ onClose })} />);
            // Кнопка крестика — SVG внутри button рядом с заголовком
            const closeButtons = screen.getAllByRole('button');
            // Крестик — первая кнопка в заголовке (перед «Отмена»)
            const closeSvgButton = closeButtons.find(btn =>
                btn.querySelector('svg path[d*="M6 18L18 6"]')
            );
            expect(closeSvgButton).toBeTruthy();
            fireEvent.click(closeSvgButton!);
            expect(onClose).toHaveBeenCalled();
        });

        it('вызывает onClose при клике на кнопку «Отмена»', () => {
            const onClose = vi.fn();
            render(<BulkCallbackSetupModal {...createProps({ onClose })} />);
            fireEvent.click(screen.getByText('Отмена'));
            expect(onClose).toHaveBeenCalled();
        });

        it('вызывает onClose при клике на оверлей (фон)', () => {
            const onClose = vi.fn();
            const { container } = render(<BulkCallbackSetupModal {...createProps({ onClose })} />);
            // Оверлей — внешний div с bg-black/50
            const overlay = container.querySelector('.bg-black\\/50');
            expect(overlay).toBeTruthy();
            fireEvent.click(overlay!);
            expect(onClose).toHaveBeenCalled();
        });

        it('НЕ вызывает onClose при клике внутри модалки (stopPropagation)', () => {
            const onClose = vi.fn();
            render(<BulkCallbackSetupModal {...createProps({ onClose })} />);
            fireEvent.click(screen.getByText('Массовая настройка Callback-серверов'));
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    //  Бейдж окружения
    // ==========================================

    describe('Бейдж окружения', () => {
        it('показывает «Локалка (SSH Tunnel)» для environment=local + ssh-tunnel', () => {
            localStorageMock['api_environment'] = 'local';
            localStorageMock['callback_tunnel_mode'] = 'ssh-tunnel';
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText(/Локалка \(SSH Tunnel\)/)).toBeInTheDocument();
        });

        it('показывает «Сервер (api.dosmmit.ru)» для environment=production', () => {
            localStorageMock['api_environment'] = 'production';
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText(/Сервер \(api\.dosmmit\.ru\)/)).toBeInTheDocument();
        });
    });

    // ==========================================
    //  Переключатель SSH Tunnel / Ngrok
    // ==========================================

    describe('Переключатель туннеля', () => {
        it('отображает переключатель SSH Tunnel / Ngrok на локалке', () => {
            localStorageMock['api_environment'] = 'local';
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText('SSH Tunnel')).toBeInTheDocument();
            expect(screen.getByText('Ngrok')).toBeInTheDocument();
        });

        it('НЕ отображает переключатель на продакшене', () => {
            localStorageMock['api_environment'] = 'production';
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.queryByText('SSH Tunnel')).not.toBeInTheDocument();
            expect(screen.queryByText('Ngrok')).not.toBeInTheDocument();
        });

        it('переключает режим туннеля при клике на Ngrok', () => {
            localStorageMock['api_environment'] = 'local';
            localStorageMock['callback_tunnel_mode'] = 'ssh-tunnel';
            render(<BulkCallbackSetupModal {...createProps()} />);
            // Кнопка Ngrok — находим по тексту внутри span
            const ngrokBtn = screen.getByText('Ngrok').closest('button');
            expect(ngrokBtn).toBeTruthy();
            fireEvent.click(ngrokBtn!);
            // После клика бейдж должен обновиться на ngrok
            expect(screen.getByText(/Локалка \(ngrok\)/)).toBeInTheDocument();
        });
    });

    // ==========================================
    //  Проверка tunnel
    // ==========================================

    describe('Проверка tunnel', () => {
        it('показывает кнопку «Проверить tunnel» в режиме SSH', () => {
            localStorageMock['api_environment'] = 'local';
            localStorageMock['callback_tunnel_mode'] = 'ssh-tunnel';
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText('Проверить tunnel')).toBeInTheDocument();
        });

        it('показывает «Tunnel активен» при успешной проверке', async () => {
            localStorageMock['api_environment'] = 'local';
            localStorageMock['callback_tunnel_mode'] = 'ssh-tunnel';
            mockDetectTunnel.mockResolvedValue({ detected: true, url: 'http://localhost:8000', message: 'OK' });

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText('Проверить tunnel'));
            });

            await waitFor(() => {
                expect(screen.getByText('Tunnel активен')).toBeInTheDocument();
            });
        });

        it('показывает сообщение об ошибке при неактивном tunnel', async () => {
            localStorageMock['api_environment'] = 'local';
            localStorageMock['callback_tunnel_mode'] = 'ssh-tunnel';
            mockDetectTunnel.mockResolvedValue({ detected: false, url: null, message: 'Connection refused' });

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText('Проверить tunnel'));
            });

            await waitFor(() => {
                expect(screen.getByText('Connection refused')).toBeInTheDocument();
            });
        });
    });

    // ==========================================
    //  Выбор событий
    // ==========================================

    describe('Выбор событий', () => {
        it('показывает секцию выбора событий', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText(/Выбрать события/)).toBeInTheDocument();
        });

        it('показывает «Все события» бейдж по умолчанию', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText('Все события')).toBeInTheDocument();
        });

        it('раскрывает список категорий при клике', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            const toggleBtn = screen.getByText(/Выбрать события/).closest('button');
            fireEvent.click(toggleBtn!);
            // Должна появиться категория «Сообщения»
            expect(screen.getByText('Сообщения')).toBeInTheDocument();
        });

        it('кнопка «Снять все» снимает выбор со всех событий', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            // Раскрываем
            const toggleBtn = screen.getByText(/Выбрать события/).closest('button');
            fireEvent.click(toggleBtn!);
            // Снять все
            fireEvent.click(screen.getByText('Снять все'));
            // Бейдж должен показывать «0 из N»
            expect(screen.getByText(`0 из ${ALL_EVENT_KEYS.length}`)).toBeInTheDocument();
        });

        it('кнопка «Выбрать все» возвращает все события', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            const toggleBtn = screen.getByText(/Выбрать события/).closest('button');
            fireEvent.click(toggleBtn!);
            // Сначала снимаем, потом выбираем
            fireEvent.click(screen.getByText('Снять все'));
            fireEvent.click(screen.getByText('Выбрать все'));
            expect(screen.getByText('Все события')).toBeInTheDocument();
        });
    });

    // ==========================================
    //  Информация о кандидатах (до запуска)
    // ==========================================

    describe('Информация о кандидатах', () => {
        it('показывает количество проектов с токеном', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('Проектов с заполненным токеном')).toBeInTheDocument();
        });

        it('показывает предупреждение если нет подходящих проектов', () => {
            const projects = [
                createProject({ id: 'proj-1', communityToken: '' }),
                createProject({ id: 'proj-2', communityToken: undefined }),
            ];
            render(<BulkCallbackSetupModal {...createProps({ projects })} />);
            expect(screen.getByText(/Нет проектов с заполненным токеном/)).toBeInTheDocument();
        });

        it('кнопка запуска disabled если нет подходящих проектов', () => {
            const projects = [createProject({ id: 'proj-1', communityToken: '' })];
            render(<BulkCallbackSetupModal {...createProps({ projects })} />);
            const startBtn = screen.getByText(/Настроить все колбэки/);
            expect(startBtn).toBeDisabled();
        });

        it('отображает инструкции по настройке', () => {
            render(<BulkCallbackSetupModal {...createProps()} />);
            expect(screen.getByText(/confirmation code/)).toBeInTheDocument();
            expect(screen.getByText(/Создание \/ обновление Callback-сервера/)).toBeInTheDocument();
        });

        it('не считает архивированные проекты', () => {
            const projects = [
                createProject({ id: 'proj-1', name: 'Активный' }),
                createProject({ id: 'proj-2', name: 'Архивный', archived: true }),
            ];
            render(<BulkCallbackSetupModal {...createProps({ projects })} />);
            // Только 1 подходящий проект
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    // ==========================================
    //  Массовая настройка — прогресс
    // ==========================================

    describe('Массовая настройка — прогресс', () => {
        it('показывает прогресс-бар после запуска', async () => {
            // setupCallbackAuto никогда не разрешается — ловим состояние «в процессе»
            let resolveFirst: (value: any) => void;
            mockSetupCallbackAuto.mockImplementation(() =>
                new Promise(resolve => { resolveFirst = resolve; })
            );

            render(<BulkCallbackSetupModal {...createProps()} />);
            const startBtn = screen.getByText(/Настроить все колбэки/);

            await act(async () => {
                fireEvent.click(startBtn);
            });

            // Прогресс должен показаться
            expect(screen.getByText(/Настройка:/)).toBeInTheDocument();
            expect(screen.getByText('Настройка Callback-сервера...')).toBeInTheDocument();

            // Разрешаем промис для cleanup
            await act(async () => {
                resolveFirst!(createSuccessResponse());
            });
        });

        it('показывает кнопку «Остановить» во время выполнения', async () => {
            let resolveFirst: (value: any) => void;
            mockSetupCallbackAuto.mockImplementation(() =>
                new Promise(resolve => { resolveFirst = resolve; })
            );

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
            });

            expect(screen.getByText('Остановить')).toBeInTheDocument();

            await act(async () => {
                resolveFirst!(createSuccessResponse());
            });
        });
    });

    // ==========================================
    //  Завершение — итоги
    // ==========================================

    describe('Итоги настройки', () => {
        it('показывает «Настройка завершена» с результатами', async () => {
            mockSetupCallbackAuto
                .mockResolvedValueOnce(createSuccessResponse({ action: 'created', message: 'Сервер создан' }))
                .mockResolvedValueOnce(createSuccessResponse({ action: 'updated', message: 'Сервер обновлён' }));

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                // Ждём завершения (таймеры для delay)
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Настройка завершена')).toBeInTheDocument();
            });

            expect(screen.getByText(/Успешно:/)).toBeInTheDocument();
        });

        it('показывает кнопку «Готово» после завершения', async () => {
            mockSetupCallbackAuto.mockResolvedValue(createSuccessResponse());

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Готово')).toBeInTheDocument();
            });
        });

        it('вызывает onComplete после завершения', async () => {
            mockSetupCallbackAuto.mockResolvedValue(createSuccessResponse());
            const onComplete = vi.fn();

            render(<BulkCallbackSetupModal {...createProps({ onComplete })} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(onComplete).toHaveBeenCalledTimes(1);
            });
        });

        it('показывает список ошибок с кнопкой «Повторить»', async () => {
            mockSetupCallbackAuto
                .mockResolvedValueOnce(createSuccessResponse())
                .mockResolvedValueOnce(createErrorResponse({ message: 'Token is invalid', error_code: 100 }));

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Настройка завершена')).toBeInTheDocument();
            });

            // Должен быть блок ошибок
            expect(screen.getByText(/Ошибки \(1\)/)).toBeInTheDocument();
            expect(screen.getByText('Token is invalid')).toBeInTheDocument();
            expect(screen.getByText('Повторить')).toBeInTheDocument();
        });

        it('показывает спецсообщение для ошибки 2000 (лимит серверов)', async () => {
            mockSetupCallbackAuto
                .mockResolvedValueOnce(createErrorResponse({
                    message: 'Callback servers limit',
                    error_code: 2000,
                }));

            const projects = [createProject({ id: 'proj-1', name: 'Проект X', vkProjectId: 99999 })];

            render(<BulkCallbackSetupModal {...createProps({ projects })} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText(/Лимит 10 серверов/)).toBeInTheDocument();
            });

            // Ссылка на настройки группы VK
            const link = screen.getByText('настройках группы VK');
            expect(link).toHaveAttribute('href', 'https://vk.com/club99999?act=api');
            expect(link).toHaveAttribute('target', '_blank');
        });

        it('показывает статистику: создано, обновлено', async () => {
            mockSetupCallbackAuto
                .mockResolvedValueOnce(createSuccessResponse({ action: 'created' }))
                .mockResolvedValueOnce(createSuccessResponse({ action: 'updated' }));

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Настройка завершена')).toBeInTheDocument();
            });

            // Проверяем статистику
            expect(screen.getByText(/Создано:/)).toBeInTheDocument();
            expect(screen.getByText(/Обновлено:/)).toBeInTheDocument();
        });
    });

    // ==========================================
    //  Retry (повтор для ошибочного проекта)
    // ==========================================

    describe('Retry ошибочного проекта', () => {
        it('повторяет запрос для конкретного проекта', async () => {
            // Первый раз — ошибка для проекта 2
            mockSetupCallbackAuto
                .mockResolvedValueOnce(createSuccessResponse()) // proj-1 ok
                .mockResolvedValueOnce(createErrorResponse({ message: 'Временная ошибка' })); // proj-2 fail

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Повторить')).toBeInTheDocument();
            });

            // Мокаем retry — теперь успешно
            mockSetupCallbackAuto.mockResolvedValueOnce(createSuccessResponse({ action: 'created', message: 'OK' }));

            await act(async () => {
                fireEvent.click(screen.getByText('Повторить'));
            });

            await waitFor(() => {
                // Ошибки должны исчезнуть
                expect(screen.queryByText('Временная ошибка')).not.toBeInTheDocument();
            });
        });
    });

    // ==========================================
    //  Остановка (abort)
    // ==========================================

    describe('Остановка процесса', () => {
        it('показывает «Настройка прервана» при остановке', async () => {
            let resolveFirst: (value: any) => void;
            mockSetupCallbackAuto.mockImplementation(() =>
                new Promise(resolve => { resolveFirst = resolve; })
            );

            render(<BulkCallbackSetupModal {...createProps()} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
            });

            // Ожидаем появления кнопки «Остановить»
            expect(screen.getByText('Остановить')).toBeInTheDocument();

            // Нажимаем остановить
            await act(async () => {
                fireEvent.click(screen.getByText('Остановить'));
            });

            // Разрешаем первый запрос, чтобы цикл завершился
            await act(async () => {
                resolveFirst!(createSuccessResponse());
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Настройка прервана')).toBeInTheDocument();
            });
        });
    });

    // ==========================================
    //  Кнопка «Готово» закрывает модалку
    // ==========================================

    describe('Кнопка «Готово»', () => {
        it('вызывает onClose при клике на «Готово»', async () => {
            mockSetupCallbackAuto.mockResolvedValue(createSuccessResponse());
            const onClose = vi.fn();

            render(<BulkCallbackSetupModal {...createProps({ onClose })} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Готово')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Готово'));
            expect(onClose).toHaveBeenCalled();
        });
    });

    // ==========================================
    //  Network error (бросает исключение)
    // ==========================================

    describe('Сетевая ошибка (throw)', () => {
        it('обрабатывает исключение как ошибку проекта', async () => {
            mockSetupCallbackAuto.mockRejectedValue(new Error('Network failure'));

            const projects = [createProject({ id: 'proj-1', name: 'Проект Сетевой' })];
            render(<BulkCallbackSetupModal {...createProps({ projects })} />);

            await act(async () => {
                fireEvent.click(screen.getByText(/Настроить все колбэки/));
                await vi.runAllTimersAsync();
            });

            await waitFor(() => {
                expect(screen.getByText('Network failure')).toBeInTheDocument();
            });
        });
    });
});
