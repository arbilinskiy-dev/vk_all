// Тесты компонента GroupsSection — секция групп пользователя
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupsSection } from '../../features/test-auth/components/GroupsSection';
import type { VkGroup } from '../../features/test-auth/types';

// Фабрика для создания тестовой группы
const createMockGroup = (overrides: Partial<VkGroup> = {}): VkGroup => ({
  id: 1,
  name: 'Тестовая группа',
  screen_name: 'test_group',
  is_closed: 0,
  type: 'group',
  photo_200: 'https://example.com/group.jpg',
  members_count: 1500,
  description: 'Описание группы',
  ...overrides,
});

const defaultProps = {
  selectedUserForGroups: '12345',
  userGroups: [] as VkGroup[],
  isLoadingGroups: false,
  groupsError: null as string | null,
  onClose: vi.fn(),
};

describe('GroupsSection — секция групп пользователя', () => {
  describe('Заголовок и навигация', () => {
    it('Отображает заголовок секции', () => {
      render(<GroupsSection {...defaultProps} />);
      expect(screen.getByText('Группы пользователя')).toBeInTheDocument();
    });

    it('Показывает VK ID пользователя в заголовке', () => {
      render(<GroupsSection {...defaultProps} selectedUserForGroups="99999" />);
      expect(screen.getByText(/99999/)).toBeInTheDocument();
    });

    it('Кнопка "Закрыть" вызывает onClose', () => {
      const onClose = vi.fn();
      render(<GroupsSection {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByText('Закрыть'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Состояние загрузки', () => {
    it('Показывает спиннер при загрузке', () => {
      const { container } = render(
        <GroupsSection {...defaultProps} isLoadingGroups={true} />
      );
      // Проверяем наличие анимации (класс animate-spin)
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Состояние ошибки', () => {
    it('Отображает сообщение об ошибке', () => {
      render(
        <GroupsSection {...defaultProps} groupsError="Токен не действителен" />
      );
      expect(screen.getByText('Ошибка получения групп')).toBeInTheDocument();
      expect(screen.getByText('Токен не действителен')).toBeInTheDocument();
    });

    it('Показывает подсказку про Standalone авторизацию при ошибке', () => {
      render(
        <GroupsSection {...defaultProps} groupsError="Error" />
      );
      expect(screen.getByText(/Standalone/)).toBeInTheDocument();
    });
  });

  describe('Пустой список групп', () => {
    it('Показывает сообщение при отсутствии групп', () => {
      render(<GroupsSection {...defaultProps} userGroups={[]} />);
      expect(screen.getByText(/нет групп/i)).toBeInTheDocument();
    });
  });

  describe('Отображение групп', () => {
    it('Рендерит группу с названием', () => {
      const group = createMockGroup({ name: 'VK Developers' });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      expect(screen.getByText('VK Developers')).toBeInTheDocument();
    });

    it('Рендерит screen_name группы', () => {
      const group = createMockGroup({ screen_name: 'vk_dev' });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      expect(screen.getByText('@vk_dev')).toBeInTheDocument();
    });

    it('Показывает количество подписчиков', () => {
      const group = createMockGroup({ members_count: 25000 });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      // toLocaleString('ru-RU') форматирует 25000 → "25 000"
      expect(screen.getByText(/25.*подписчиков/)).toBeInTheDocument();
    });

    it('Отображает тип "Группа" для type=group', () => {
      const group = createMockGroup({ type: 'group' });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      expect(screen.getByText('Группа')).toBeInTheDocument();
    });

    it('Отображает тип "Страница" для type=page', () => {
      const group = createMockGroup({ type: 'page' });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      expect(screen.getByText('Страница')).toBeInTheDocument();
    });

    it('Отображает тип "Мероприятие" для type=event', () => {
      const group = createMockGroup({ type: 'event' });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      expect(screen.getByText('Мероприятие')).toBeInTheDocument();
    });

    it('Ссылка на группу ведёт на VK', () => {
      const group = createMockGroup({ screen_name: 'my_group' });
      render(<GroupsSection {...defaultProps} userGroups={[group]} />);
      
      const link = screen.getByRole('link', { name: group.name });
      expect(link).toHaveAttribute('href', 'https://vk.com/my_group');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('Отображает несколько групп', () => {
      const groups = [
        createMockGroup({ id: 1, name: 'Группа 1' }),
        createMockGroup({ id: 2, name: 'Группа 2' }),
        createMockGroup({ id: 3, name: 'Группа 3' }),
      ];
      render(<GroupsSection {...defaultProps} userGroups={groups} />);
      
      expect(screen.getByText('Группа 1')).toBeInTheDocument();
      expect(screen.getByText('Группа 2')).toBeInTheDocument();
      expect(screen.getByText('Группа 3')).toBeInTheDocument();
    });
  });
});
