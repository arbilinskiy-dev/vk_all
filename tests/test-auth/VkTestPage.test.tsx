// Тесты хаб-компонента VkTestPage
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VkTestPage } from '../../features/test-auth/VkTestPage';

// Мокаем хук useVkTestLogic чтобы изолировать тестирование хаб-компонента
vi.mock('../../features/test-auth/hooks/useVkTestLogic', () => ({
  useVkTestLogic: () => ({
    state: {
      activeAppId: 54423358,
      authResult: null,
      logs: ['Тестовый лог'],
      authContext: null,
      vkUsers: [],
      isLoadingUsers: false,
      selectedUserForGroups: null,
      userGroups: [],
      isLoadingGroups: false,
      groupsError: null,
      isStandaloneLoading: false,
    },
    actions: {
      setActiveAppId: vi.fn(),
      addLog: vi.fn(),
      clearLogs: vi.fn(),
      startStandaloneAuth: vi.fn(),
      fetchVkUsers: vi.fn(),
      handleDeleteUser: vi.fn(),
      fetchUserGroups: vi.fn(),
      manualLogin: vi.fn(),
      setSelectedUserForGroups: vi.fn(),
      setUserGroups: vi.fn(),
      setGroupsError: vi.fn(),
    },
  }),
}));

describe('VkTestPage — хаб-компонент', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Рендерится без ошибок', () => {
    render(<VkTestPage />);
    expect(screen.getByText('VK Auth Test Integration')).toBeInTheDocument();
  });

  it('Отображает кнопки переключения App ID', () => {
    render(<VkTestPage />);
    expect(screen.getByText(/Main App/)).toBeInTheDocument();
    expect(screen.getByText(/New App/)).toBeInTheDocument();
  });

  it('Отображает панель логов с тестовым логом', () => {
    render(<VkTestPage />);
    expect(screen.getByText('Тестовый лог')).toBeInTheDocument();
  });

  it('Отображает таблицу пользователей (пустую)', () => {
    render(<VkTestPage />);
    expect(screen.getByText(/Авторизованные VK пользователи/)).toBeInTheDocument();
    expect(screen.getByText(/Пока нет авторизованных пользователей/)).toBeInTheDocument();
  });

  it('Не отображает секцию групп если selectedUserForGroups = null', () => {
    render(<VkTestPage />);
    expect(screen.queryByText('Группы пользователя')).not.toBeInTheDocument();
  });

  it('Отображает секцию Standalone авторизации', () => {
    render(<VkTestPage />);
    expect(screen.getByText(/Standalone OAuth/)).toBeInTheDocument();
  });

  it('Содержит кнопку очистки логов', () => {
    render(<VkTestPage />);
    expect(screen.getByText('Очистить')).toBeInTheDocument();
  });
});
