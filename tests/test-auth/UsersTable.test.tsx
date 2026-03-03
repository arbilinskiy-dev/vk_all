// Тесты компонента UsersTable — таблица VK пользователей
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsersTable } from '../../features/test-auth/components/UsersTable';
import type { VkUserFromDb } from '../../features/test-auth/types';

// Фабрика для создания тестового пользователя
const createMockUser = (overrides: Partial<VkUserFromDb> = {}): VkUserFromDb => ({
  vk_user_id: '123456',
  first_name: 'Иван',
  last_name: 'Петров',
  photo_url: 'https://example.com/photo.jpg',
  email: 'ivan@example.com',
  scope: 'friends,groups',
  app_id: '54423358',
  is_active: true,
  access_token: 'vk1.a.test_token_123456789',
  last_login: '2026-03-01T12:00:00',
  created_at: '2026-01-15T10:00:00',
  token_expires_at: '2027-03-01T12:00:00',
  ...overrides,
});

// Дефолтные пропсы
const defaultProps = {
  vkUsers: [] as VkUserFromDb[],
  isLoadingUsers: false,
  isLoadingGroups: false,
  selectedUserForGroups: null,
  onRefresh: vi.fn(),
  onDeleteUser: vi.fn(),
  onFetchGroups: vi.fn(),
};

describe('UsersTable — таблица авторизованных VK пользователей', () => {
  describe('Пустое состояние', () => {
    it('Показывает сообщение когда нет пользователей', () => {
      render(<UsersTable {...defaultProps} />);
      expect(screen.getByText(/Пока нет авторизованных пользователей/i)).toBeInTheDocument();
    });

    it('Отображает счётчик (0)', () => {
      render(<UsersTable {...defaultProps} />);
      expect(screen.getByText('(0)')).toBeInTheDocument();
    });

    it('Кнопка "Обновить" доступна', () => {
      render(<UsersTable {...defaultProps} />);
      expect(screen.getByText('Обновить')).toBeInTheDocument();
    });
  });

  describe('Рендер с пользователями', () => {
    it('Отображает имя и фамилию пользователя', () => {
      const user = createMockUser();
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    it('Отображает VK ID пользователя', () => {
      const user = createMockUser({ vk_user_id: '999888' });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('999888')).toBeInTheDocument();
    });

    it('Отображает email пользователя', () => {
      const user = createMockUser({ email: 'test@mail.ru' });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('test@mail.ru')).toBeInTheDocument();
    });

    it('Отображает счётчик с количеством пользователей', () => {
      const users = [
        createMockUser({ vk_user_id: '1' }),
        createMockUser({ vk_user_id: '2' }),
      ];
      render(<UsersTable {...defaultProps} vkUsers={users} />);
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('Показывает статус "Активен" для активного пользователя', () => {
      const user = createMockUser({ is_active: true });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('Активен')).toBeInTheDocument();
    });

    it('Показывает статус "Неактивен" для неактивного пользователя', () => {
      const user = createMockUser({ is_active: false });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('Неактивен')).toBeInTheDocument();
    });

    it('Показывает статус "Истёк" для просроченного токена', () => {
      const user = createMockUser({ token_expires_at: '2020-01-01T00:00:00' });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('Истёк')).toBeInTheDocument();
    });

    it('Отображает усечённый токен (первые 20 символов + ...)', () => {
      const token = 'vk1.a.very_long_token_value_here';
      const user = createMockUser({ access_token: token });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      // Компонент берёт substring(0, 20) + '...'
      const expected = token.substring(0, 20) + '...';
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('Показывает заглушку если нет фото', () => {
      const user = createMockUser({ photo_url: null });
      render(<UsersTable {...defaultProps} vkUsers={[user]} />);
      expect(screen.getByText('VK')).toBeInTheDocument();
    });
  });

  describe('Действия пользователя', () => {
    it('Кнопка "Обновить" вызывает onRefresh', () => {
      const onRefresh = vi.fn();
      render(<UsersTable {...defaultProps} onRefresh={onRefresh} />);
      fireEvent.click(screen.getByText('Обновить'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('Клик по иконке удаления вызывает onDeleteUser с правильным ID', () => {
      const onDeleteUser = vi.fn();
      const user = createMockUser({ vk_user_id: '555' });
      render(<UsersTable {...defaultProps} vkUsers={[user]} onDeleteUser={onDeleteUser} />);
      
      const deleteButton = screen.getByTitle('Удалить пользователя');
      fireEvent.click(deleteButton);
      expect(onDeleteUser).toHaveBeenCalledWith('555');
    });

    it('Клик по иконке групп вызывает onFetchGroups с правильным ID', () => {
      const onFetchGroups = vi.fn();
      const user = createMockUser({ vk_user_id: '777' });
      render(<UsersTable {...defaultProps} vkUsers={[user]} onFetchGroups={onFetchGroups} />);
      
      const groupsButton = screen.getByTitle('Получить группы');
      fireEvent.click(groupsButton);
      expect(onFetchGroups).toHaveBeenCalledWith('777');
    });

    it('Кнопка "Обновить" заблокирована при загрузке', () => {
      render(<UsersTable {...defaultProps} isLoadingUsers={true} />);
      const btn = screen.getByText('Обновить').closest('button');
      expect(btn).toBeDisabled();
    });
  });

  describe('Несколько пользователей', () => {
    it('Отображает всех пользователей в таблице', () => {
      const users = [
        createMockUser({ vk_user_id: '1', first_name: 'Алексей', last_name: 'Иванов' }),
        createMockUser({ vk_user_id: '2', first_name: 'Мария', last_name: 'Сидорова' }),
        createMockUser({ vk_user_id: '3', first_name: 'Олег', last_name: 'Козлов' }),
      ];
      render(<UsersTable {...defaultProps} vkUsers={users} />);
      
      expect(screen.getByText('Алексей Иванов')).toBeInTheDocument();
      expect(screen.getByText('Мария Сидорова')).toBeInTheDocument();
      expect(screen.getByText('Олег Козлов')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });
  });
});
