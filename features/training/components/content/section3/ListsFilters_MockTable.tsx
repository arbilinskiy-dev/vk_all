import React from 'react';

// =====================================================================
// Mock-таблица пользователей (упрощённая версия)
// =====================================================================

/** Данные mock-пользователей для демонстрации */
const mockUsers = [
    { id: 123456789, name: 'Александр Иванов', sex: 'М', age: 28, city: 'Москва', status: 'Активен' },
    { id: 987654321, name: 'Мария Петрова', sex: 'Ж', age: 24, city: 'Санкт-Петербург', status: 'Активен' },
    { id: 555444333, name: 'Дмитрий Сидоров', sex: 'М', age: 32, city: 'Казань', status: 'Активен' },
    { id: 111222333, name: 'Елена Смирнова', sex: 'Ж', age: 19, city: 'Нижний Новгород', status: 'Активен' },
    { id: 777888999, name: 'Игорь Козлов', sex: 'М', age: 45, city: 'Екатеринбург', status: 'Активен' }
];

export const MockMembersTable: React.FC = () => {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Пользователь</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Пол</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Возраст</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Город</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Статус</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {mockUsers.map((user, idx) => (
                        <tr key={user.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{user.sex}</td>
                            <td className="px-4 py-3 text-gray-700">{user.age}</td>
                            <td className="px-4 py-3 text-gray-700">{user.city}</td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    {user.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
