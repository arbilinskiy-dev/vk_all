/**
 * Тесты компонента TaskProgressBar.
 * Покрывает: рендер прогресс-бара, таблицу проектов, фильтрацию.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskProgressBar } from '../../features/settings/components/TaskProgressBar';
import type { RefreshProgress, ProjectProgress } from '../../services/api/lists.api';

// Хелпер: базовый прогресс
const makeProgress = (overrides: Partial<RefreshProgress> = {}): RefreshProgress => ({
    status: 'processing',
    loaded: 3,
    total: 10,
    message: 'Обработка проекта...',
    ...overrides,
});

// Хелпер: список проектов (формат v2)
const makeProjectsSubMessage = (projects: Partial<ProjectProgress>[]): string => {
    const full: ProjectProgress[] = projects.map((p, i) => ({
        project_id: p.project_id ?? `p${i}`,
        project_name: p.project_name ?? `Проект ${i + 1}`,
        vk_id: p.vk_id ?? `${100 + i}`,
        status: p.status ?? 'done',
        token_name: p.token_name ?? 'token',
        loaded: p.loaded ?? 0,
        total: p.total ?? 0,
        added: p.added ?? 0,
        left: p.left ?? 0,
        error: p.error ?? '',
    }));
    return JSON.stringify(full);
};

describe('TaskProgressBar', () => {
    // ─── Базовый рендер ─────────────────────────────────────────────────

    it('рендерит label прогресс-бара', () => {
        render(<TaskProgressBar progress={makeProgress()} label="Проекты" />);
        expect(screen.getByText('Проекты')).toBeInTheDocument();
    });

    it('отображает loaded / total', () => {
        render(<TaskProgressBar progress={makeProgress({ loaded: 5, total: 20 })} label="Проекты" />);
        expect(screen.getByText('5 / 20')).toBeInTheDocument();
    });

    it('показывает текст "Обработка...", если loaded/total не заданы', () => {
        render(
            <TaskProgressBar
                progress={makeProgress({ loaded: undefined, total: undefined, message: undefined })}
                label="Тест"
            />,
        );
        expect(screen.getByText('Обработка...')).toBeInTheDocument();
    });

    it('показывает сообщение из message, если нет loaded/total', () => {
        render(
            <TaskProgressBar
                progress={makeProgress({ loaded: undefined, total: undefined, message: 'Ждём...' })}
                label="Тест"
            />,
        );
        // message может появляться в нескольких местах (loaded/total + отдельный блок)
        const matches = screen.getAllByText('Ждём...');
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    // ─── Время выполнения ───────────────────────────────────────────────

    it('показывает "Выполняется:" для активных задач', () => {
        const now = Date.now() / 1000;
        render(
            <TaskProgressBar
                progress={makeProgress({ status: 'processing', created_at: now - 120 })}
                label="Тест"
            />,
        );
        // Должен содержать "Выполняется:"
        expect(screen.getByText(/Выполняется:/)).toBeInTheDocument();
    });

    it('показывает "Завершено за" для done-задач', () => {
        const now = Date.now() / 1000;
        render(
            <TaskProgressBar
                progress={makeProgress({
                    status: 'done',
                    created_at: now - 65,
                    finished_at: now,
                })}
                label="Тест"
            />,
        );
        expect(screen.getByText(/Завершено за/)).toBeInTheDocument();
    });

    // ─── Цвет прогресс-бара по статусу ──────────────────────────────────

    it('прогресс-бар красный при ошибке', () => {
        const { container } = render(
            <TaskProgressBar
                progress={makeProgress({ status: 'error', loaded: 5, total: 10 })}
                label="Тест"
            />,
        );
        const bar = container.querySelector('.bg-red-500');
        expect(bar).toBeInTheDocument();
    });

    it('прогресс-бар зелёный при done', () => {
        const { container } = render(
            <TaskProgressBar
                progress={makeProgress({ status: 'done', loaded: 10, total: 10 })}
                label="Тест"
            />,
        );
        const bar = container.querySelector('.bg-green-500');
        expect(bar).toBeInTheDocument();
    });

    // ─── Таблица проектов (формат v2) ───────────────────────────────────

    it('рендерит таблицу проектов, если sub_message содержит проекты', () => {
        const subMsg = makeProjectsSubMessage([
            { project_name: 'Альфа', status: 'done' },
            { project_name: 'Бета', status: 'error', error: 'Timeout' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Проекты"
            />,
        );
        expect(screen.getByText('Альфа')).toBeInTheDocument();
        expect(screen.getByText('Бета')).toBeInTheDocument();
    });

    it('показывает заголовки таблицы: Проект, Токен, Статус, Прогресс', () => {
        const subMsg = makeProjectsSubMessage([{ project_name: 'X', status: 'done' }]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );
        expect(screen.getByText('Проект')).toBeInTheDocument();
        expect(screen.getByText('Токен')).toBeInTheDocument();
        expect(screen.getByText('Статус')).toBeInTheDocument();
        expect(screen.getByText('Прогресс')).toBeInTheDocument();
    });

    it('показывает ошибку проекта в таблице', () => {
        const subMsg = makeProjectsSubMessage([
            { project_name: 'Проблемный', status: 'error', error: 'Нет доступа' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );
        expect(screen.getByText('Нет доступа')).toBeInTheDocument();
    });

    // ─── Фильтрация проектов ────────────────────────────────────────────

    it('фильтрует проекты по статусу "Ошибки"', async () => {
        const user = userEvent.setup();
        const subMsg = makeProjectsSubMessage([
            { project_id: 'ok1', project_name: 'Хороший', status: 'done' },
            { project_id: 'err1', project_name: 'Плохой', status: 'error', error: 'fail' },
            { project_id: 'ok2', project_name: 'Ещё хороший', status: 'done' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );

        // Изначально все проекты видны
        expect(screen.getByText('Хороший')).toBeInTheDocument();
        expect(screen.getByText('Плохой')).toBeInTheDocument();
        expect(screen.getByText('Ещё хороший')).toBeInTheDocument();

        // Нажимаем фильтр "Ошибки"
        const errorFilter = screen.getByText(/^Ошибки/);
        await user.click(errorFilter);

        // Должен остаться только «Плохой»
        expect(screen.getByText('Плохой')).toBeInTheDocument();
        expect(screen.queryByText('Хороший')).not.toBeInTheDocument();
        expect(screen.queryByText('Ещё хороший')).not.toBeInTheDocument();
    });

    it('фильтрует проекты по статусу "Готово"', async () => {
        const user = userEvent.setup();
        const subMsg = makeProjectsSubMessage([
            { project_id: 'd1', project_name: 'Готовый проект', status: 'done' },
            { project_id: 'e1', project_name: 'Ошибочный проект', status: 'error', error: 'x' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );

        // Ищем кнопку-фильтр "Готово - N" (в мини-фильтрах)
        const doneFilters = screen.getAllByText(/^Готово/);
        // Кнопка фильтра — та, что содержит " - "
        const filterBtn = doneFilters.find(el => el.textContent?.includes(' - '));
        expect(filterBtn).toBeTruthy();
        await user.click(filterBtn!);

        expect(screen.getByText('Готовый проект')).toBeInTheDocument();
        expect(screen.queryByText('Ошибочный проект')).not.toBeInTheDocument();
    });

    it('показывает «Нет проектов по выбранному фильтру», если фильтр не нашёл совпадений', async () => {
        const user = userEvent.setup();
        // Все проекты — done, пропущенных нет
        const subMsg = makeProjectsSubMessage([
            { project_id: 'd1', project_name: 'A', status: 'done' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );

        // Фильтр «Пропущено» — 0 проектов
        const skippedFilter = screen.getByText(/^Пропущено/);
        await user.click(skippedFilter);

        expect(screen.getByText('Нет проектов по выбранному фильтру')).toBeInTheDocument();
    });

    // ─── Статистика проектов ────────────────────────────────────────────

    it('показывает статистику "Проекты - N/M"', () => {
        const subMsg = makeProjectsSubMessage([
            { status: 'done' },
            { status: 'done' },
            { status: 'error', error: 'x' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );
        // 2 из 3 готовы
        expect(screen.getByText(/Проекты - 2\/3/)).toBeInTheDocument();
    });

    it('показывает количество ошибок в заголовке, если есть ошибки', () => {
        const subMsg = makeProjectsSubMessage([
            { status: 'error', error: 'x' },
            { status: 'error', error: 'y' },
            { status: 'done' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );
        expect(screen.getByText(/2 ошибок/)).toBeInTheDocument();
    });

    // ─── Блок сворачивания ──────────────────────────────────────────────

    it('сворачивает таблицу проектов при клике на заголовок', async () => {
        const user = userEvent.setup();
        const subMsg = makeProjectsSubMessage([
            { project_name: 'Видимый', status: 'done' },
        ]);
        render(
            <TaskProgressBar
                progress={makeProgress({ sub_message: subMsg })}
                label="Тест"
            />,
        );

        // Проект виден
        expect(screen.getByText('Видимый')).toBeInTheDocument();

        // Кликаем на заголовок «Проекты - ...», чтобы свернуть
        const toggleBtn = screen.getByText(/Проекты - /);
        await user.click(toggleBtn);

        // После сворачивания таблица не отображается
        expect(screen.queryByText('Видимый')).not.toBeInTheDocument();
    });

    // ─── Блок ошибок ────────────────────────────────────────────────────

    it('показывает текстовую ошибку из progress.error', () => {
        render(
            <TaskProgressBar
                progress={makeProgress({ status: 'error', error: 'Что-то пошло не так' })}
                label="Тест"
            />,
        );
        expect(screen.getByText(/Что-то пошло не так/)).toBeInTheDocument();
    });

    it('показывает детализированные ошибки из JSON progress.error', () => {
        const errorJson = JSON.stringify({
            errors: [
                { project_id: '1', project_name: 'Проект X', error: 'Timeout' },
            ],
        });
        const { container } = render(
            <TaskProgressBar
                progress={makeProgress({ status: 'error', error: errorJson })}
                label="Тест"
            />,
        );
        // summary содержит текст «1 проектов»
        expect(screen.getByText(/1 проектов/)).toBeInTheDocument();
        // Имя проекта и ошибка — внутри details, текст разбит по элементам
        const details = container.querySelector('details');
        expect(details).toBeTruthy();
        expect(details!.textContent).toContain('Проект X');
        expect(details!.textContent).toContain('Timeout');
    });

    // ─── Старый формат (sub-progress) ───────────────────────────────────

    it('рендерит вложенный прогресс-бар (старый формат sub_total/sub_loaded)', () => {
        render(
            <TaskProgressBar
                progress={makeProgress({
                    sub_loaded: 50,
                    sub_total: 200,
                    sub_message: 'Подписчики...',
                })}
                label="Тест"
            />,
        );
        expect(screen.getByText('Подписчики...')).toBeInTheDocument();
        expect(screen.getByText('50 / 200')).toBeInTheDocument();
    });
});
