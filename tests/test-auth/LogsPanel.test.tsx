// Тесты компонента LogsPanel — панель логов
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogsPanel } from '../../features/test-auth/components/LogsPanel';

describe('LogsPanel — панель логов', () => {
  it('Отображает заголовок "Logs"', () => {
    render(<LogsPanel logs={[]} onClearLogs={vi.fn()} />);
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('Показывает placeholder при пустых логах', () => {
    render(<LogsPanel logs={[]} onClearLogs={vi.fn()} />);
    expect(screen.getByText(/Логи пусты/i)).toBeInTheDocument();
  });

  it('Отображает переданные логи', () => {
    const logs = [
      '12:00:00 - Первое сообщение',
      '12:00:01 - Второе сообщение',
      '12:00:02 - Третье сообщение',
    ];
    render(<LogsPanel logs={logs} onClearLogs={vi.fn()} />);
    
    logs.forEach((log) => {
      expect(screen.getByText(log)).toBeInTheDocument();
    });
  });

  it('Не показывает placeholder если есть логи', () => {
    render(<LogsPanel logs={['test log']} onClearLogs={vi.fn()} />);
    expect(screen.queryByText(/Логи пусты/i)).not.toBeInTheDocument();
  });

  it('Кнопка "Очистить" вызывает onClearLogs при клике', () => {
    const onClearLogs = vi.fn();
    render(<LogsPanel logs={['some log']} onClearLogs={onClearLogs} />);
    
    const clearButton = screen.getByText('Очистить');
    fireEvent.click(clearButton);
    
    expect(onClearLogs).toHaveBeenCalledTimes(1);
  });

  it('Кнопка очистки присутствует даже при пустых логах', () => {
    render(<LogsPanel logs={[]} onClearLogs={vi.fn()} />);
    expect(screen.getByText('Очистить')).toBeInTheDocument();
  });

  it('Отображает все логи когда их много', () => {
    const logs = Array.from({ length: 20 }, (_, i) => `Лог #${i + 1}`);
    render(<LogsPanel logs={logs} onClearLogs={vi.fn()} />);
    
    expect(screen.getByText('Лог #1')).toBeInTheDocument();
    expect(screen.getByText('Лог #20')).toBeInTheDocument();
  });
});
