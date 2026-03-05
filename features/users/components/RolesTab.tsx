/**
 * Компонент управления ролями пользователей.
 * Позволяет создавать/удалять роли и назначать их пользователям.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    getUsersWithRoles,
    UserRole,
    UserWithRole,
} from '../../../services/api/roles.api';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';
import { plural } from '../../../shared/utils/plural';
import showAppToast from '../../../shared/toastBridge';

/**
 * Предустановленные цвета ролей.
 * hex — хранится в БД и используется для динамических inline-стилей (бейджи пользователей).
 * tw — Tailwind-класс для статических элементов палитры (кнопки выбора цвета).
 */
interface RoleColor {
    hex: string;
    tw: string;
    label: string;
}

const ROLE_COLORS: RoleColor[] = [
    { hex: '#6366f1', tw: 'bg-indigo-500', label: 'Индиго' },
    { hex: '#8b5cf6', tw: 'bg-violet-500', label: 'Фиолетовый' },
    { hex: '#ec4899', tw: 'bg-pink-500', label: 'Розовый' },
    { hex: '#ef4444', tw: 'bg-red-500', label: 'Красный' },
    { hex: '#f97316', tw: 'bg-orange-500', label: 'Оранжевый' },
    { hex: '#eab308', tw: 'bg-yellow-500', label: 'Жёлтый' },
    { hex: '#22c55e', tw: 'bg-green-500', label: 'Зелёный' },
    { hex: '#14b8a6', tw: 'bg-teal-500', label: 'Бирюзовый' },
    { hex: '#3b82f6', tw: 'bg-blue-500', label: 'Синий' },
    { hex: '#6b7280', tw: 'bg-gray-500', label: 'Серый' },
];

/** Маппинг hex → Tailwind-класс для отображения динамических цветов из БД */
const HEX_TO_TW: Record<string, string> = Object.fromEntries(
    ROLE_COLORS.map((c) => [c.hex, c.tw])
);

/** Получить Tailwind bg-класс по hex-значению, или fallback bg-gray-500 */
const getTwBg = (hex: string | null | undefined): string => {
    if (!hex) return 'bg-gray-500';
    return HEX_TO_TW[hex] ?? 'bg-gray-500';
};

export const RolesTab: React.FC = () => {
    // --- Состояния ---
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Форма создания роли
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0].hex);
    const [isCreating, setIsCreating] = useState(false);

    // Редактирование роли
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editColor, setEditColor] = useState('');

    // Модалка подтверждения удаления (вместо confirm())
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Загрузка данных ---
    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [rolesRes, usersRes] = await Promise.all([
                getRoles(),
                getUsersWithRoles(),
            ]);
            setRoles(rolesRes?.roles ?? []);
            setUsers(usersRes?.users ?? []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Создание роли ---
    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        setIsCreating(true);
        try {
            await createRole({
                name: newRoleName.trim(),
                description: newRoleDescription.trim() || undefined,
                color: newRoleColor,
            });
            setNewRoleName('');
            setNewRoleDescription('');
            setNewRoleColor(ROLE_COLORS[0].hex);
            showAppToast('Роль создана', 'success');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка создания роли');
        } finally {
            setIsCreating(false);
        }
    };

    // --- Обновление роли ---
    const handleStartEdit = (role: UserRole) => {
        setEditingRoleId(role.id);
        setEditName(role.name);
        setEditDescription(role.description || '');
        setEditColor(role.color);
    };

    const handleSaveEdit = async () => {
        if (!editingRoleId || !editName.trim()) return;
        try {
            await updateRole({
                role_id: editingRoleId,
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                color: editColor,
            });
            setEditingRoleId(null);
            showAppToast('Роль обновлена', 'success');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка обновления роли');
        }
    };

    const handleCancelEdit = () => {
        setEditingRoleId(null);
    };

    // --- Удаление роли (через ConfirmationModal) ---
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteRole(deleteTarget.id);
            showAppToast('Роль удалена', 'success');
            setDeleteTarget(null);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка удаления роли');
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Назначение роли пользователю ---
    const handleAssignRole = async (userId: string, roleId: string | null) => {
        try {
            await assignRole(userId, roleId);
            showAppToast('Роль назначена', 'success');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка назначения роли');
        }
    };

    // --- Рендер ---
    return (
        <div className="space-y-6">
            {/* Ошибка — плавное появление */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm animate-fade-in-up">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-500 hover:text-red-700 font-medium"
                    >
                        Закрыть
                    </button>
                </div>
            )}

            {/* ===== БЛОК 1: Управление ролями ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Роли
                </h3>

                {/* Форма создания */}
                <div className="flex items-end gap-3 mb-4 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="SMM-менеджер"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Описание</label>
                        <input
                            type="text"
                            value={newRoleDescription}
                            onChange={(e) => setNewRoleDescription(e.target.value)}
                            placeholder="Необязательно"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Цвет</label>
                        <div className="flex gap-1">
                            {ROLE_COLORS.map((c) => (
                                <button
                                    key={c.hex}
                                    onClick={() => setNewRoleColor(c.hex)}
                                    className={`h-8 w-8 rounded-full border-2 transition-all ${c.tw} ${
                                        newRoleColor === c.hex ? 'border-gray-800 scale-110' : 'border-transparent'
                                    }`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleCreateRole}
                        disabled={!newRoleName.trim() || isCreating}
                        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                    >
                        {isCreating ? 'Создание...' : 'Создать роль'}
                    </button>
                </div>

                {/* Список ролей */}
                {roles.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Роли ещё не созданы</p>
                ) : (
                    <div className="space-y-2">
                        {roles.map((role, index) => (
                            <div
                                key={role.id}
                                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-md border border-gray-100 opacity-0 animate-fade-in-up"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                {editingRoleId === role.id ? (
                                    /* Режим редактирования */
                                    <>
                                        <div
                                            className={`h-4 w-4 rounded-full flex-shrink-0 ${getTwBg(editColor)}`}
                                        />
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Описание"
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                        />
                                        <div className="flex gap-1">
                                            {ROLE_COLORS.map((c) => (
                                                <button
                                                    key={c.hex}
                                                    onClick={() => setEditColor(c.hex)}
                                                    className={`h-5 w-5 rounded-full border-2 transition-all ${c.tw} ${
                                                        editColor === c.hex ? 'border-gray-800 scale-110' : 'border-transparent'
                                                    }`}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Отмена
                                        </button>
                                    </>
                                ) : (
                                    /* Режим просмотра */
                                    <>
                                        <div
                                            className={`h-4 w-4 rounded-full flex-shrink-0 ${getTwBg(role.color)}`}
                                        />
                                        <span className="text-sm font-medium text-gray-900">{role.name}</span>
                                        {role.description && (
                                            <span className="text-sm text-gray-500">— {role.description}</span>
                                        )}
                                        <span className="text-xs text-gray-400 ml-auto">
                                            {plural(users.filter((u) => u.role_id === role.id).length, ['человек', 'человека', 'человек'])}
                                        </span>
                                        <button
                                            onClick={() => handleStartEdit(role)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget({ id: role.id, name: role.name })}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Удалить
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ===== БЛОК 2: Назначение ролей пользователям ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Назначение ролей
                </h3>

                {users.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Нет пользователей</p>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full table-fixed">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
                                        ФИО
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
                                        Логин
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
                                        Роль
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
                                        Действия
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr
                                        key={user.user_id}
                                        className="border-b border-gray-50 last:border-b-0 opacity-0 animate-fade-in-up"
                                        style={{ animationDelay: `${index * 20}ms` }}
                                    >
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {user.full_name || '—'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                                            {user.username}
                                        </td>
                                        <td className="px-4 py-2">
                                            {user.role_name ? (
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${getTwBg(user.role_color)}`}
                                                >
                                                    {user.role_name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Не назначена</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={user.role_id || ''}
                                                onChange={(e) =>
                                                    handleAssignRole(
                                                        user.user_id,
                                                        e.target.value || null
                                                    )
                                                }
                                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Без роли</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Модалка подтверждения удаления — вместо нативного confirm() */}
            {deleteTarget && (
                <ConfirmationModal
                    title="Удалить роль?"
                    message={`Роль «${deleteTarget.name}» будет удалена. У пользователей с этой ролью она будет сброшена.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                    confirmText="Да, удалить"
                    cancelText="Отмена"
                    isConfirming={isDeleting}
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};
