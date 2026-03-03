
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../../../services/api';
import * as managementApi from '../../../../services/api/management.api';
import { AdministeredGroup } from '../../../../shared/types';

interface AddProjectsModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Tab = 'urls' | 'database';

/** Аватар группы со скелетоном и плавным появлением (дизайн-система) */
const GroupAvatar: React.FC<{ src: string }> = ({ src }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="w-8 h-8 rounded-full mr-3 flex-shrink-0 relative overflow-hidden border border-gray-200">
            {/* Скелетон */}
            {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />}
            <img
                src={src}
                alt=""
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
};

export const AddProjectsModal: React.FC<AddProjectsModalProps> = ({ onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<Tab>('urls');
    
    // State for URLs tab
    const [urls, setUrls] = useState('');
    
    // State for Database tab
    const [adminGroups, setAdminGroups] = useState<AdministeredGroup[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузка групп при переключении вкладки
    useEffect(() => {
        if (activeTab === 'database' && adminGroups.length === 0) {
            loadAdminGroups();
        }
    }, [activeTab]);

    const loadAdminGroups = async () => {
        setIsLoadingGroups(true);
        try {
            const data = await managementApi.getAdministeredGroups();
            setAdminGroups(data);
        } catch (e) {
            console.error(e);
            setError("Не удалось загрузить список администрируемых групп.");
        } finally {
            setIsLoadingGroups(false);
        }
    };

    // Логика фильтрации
    const filteredGroups = useMemo(() => {
        if (!searchQuery) return adminGroups;

        const rawQuery = searchQuery.toLowerCase();
        // Нормализация для поиска (удаляем пробелы)
        const normalizedQuery = rawQuery.replace(/\s+/g, ''); 

        return adminGroups.filter(g => {
            // 1. Поиск по названию (с игнорированием пробелов)
            const normalizedName = g.name.toLowerCase().replace(/\s+/g, '');
            if (normalizedName.includes(normalizedQuery)) return true;

            // 2. Поиск по ID
            if (String(g.id).includes(normalizedQuery)) return true;

            // 3. Поиск по Screen Name
            if (g.screen_name && g.screen_name.toLowerCase().includes(normalizedQuery)) return true;

            // 4. Парсинг ссылки (если вставили ссылку в поиск)
            // Поддерживаем оба домена: vk.com и vk.ru
            let cleanQuery = rawQuery
                .replace(/https?:\/\/(www\.)?vk\.(com|ru)\//, '')
                .replace(/vk\.(com|ru)\//, '');
                
            cleanQuery = cleanQuery
                .replace(/^public/, '')
                .replace(/^club/, '')
                .replace(/^event/, '')
                .split('?')[0];

            if (cleanQuery) {
                 if (String(g.id) === cleanQuery) return true;
                 if (g.screen_name && g.screen_name.toLowerCase() === cleanQuery) return true;
            }

            return false;
        });
    }, [adminGroups, searchQuery]);

    const handleToggleGroup = (id: number) => {
        setSelectedGroupIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedGroupIds.size === filteredGroups.length) {
            setSelectedGroupIds(new Set());
        } else {
            const allIds = filteredGroups.map(g => g.id);
            setSelectedGroupIds(new Set(allIds));
        }
    };

    const handleSave = async () => {
        let urlsPayload = '';

        if (activeTab === 'urls') {
            urlsPayload = urls;
            if (!urlsPayload.trim()) {
                setError("Пожалуйста, вставьте хотя бы одну ссылку.");
                return;
            }
        } else {
            if (selectedGroupIds.size === 0) {
                setError("Выберите хотя бы одну группу.");
                return;
            }
            // Генерируем ссылки из ID
            urlsPayload = Array.from(selectedGroupIds)
                .map(id => `https://vk.com/club${id}`)
                .join('\n');
        }

        setIsSaving(true);
        setError(null);
        try {
            console.log("MODAL: Отправка URL на бэкенд для добавления проектов...");
            const result = await api.addProjectsByUrls(urlsPayload);
            console.log("MODAL: Получен ответ от бэкенда:", result);
            window.showAppToast?.(`Операция завершена!\n\n- Добавлено новых проектов: ${result.added}\n- Пропущено (дубликаты): ${result.skipped}\n- Ошибки обработки: ${result.errors}`, 'info');
            onSuccess();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
            setError(`Не удалось добавить проекты: ${errorMessage}`);
            console.error("Failed to add projects by URLs:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Добавить новые проекты</h2>
                        <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-gray-600 disabled:opacity-50" title="Закрыть">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="px-4 pt-2 border-b border-gray-200">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('urls')}
                                className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'urls' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Вставить ссылки
                            </button>
                            <button
                                onClick={() => setActiveTab('database')}
                                className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'database' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Из базы администрируемых
                            </button>
                        </div>
                    </div>
                </header>
                
                <main className="p-6 space-y-4 flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'urls' ? (
                        <>
                            <div>
                                <label htmlFor="project-urls" className="block text-sm font-medium text-gray-700">Список ссылок на сообщества VK</label>
                                <p className="text-xs text-gray-500 mb-2">Вставьте по одной ссылке на каждой строке. Существующие проекты будут проигнорированы.</p>
                                <textarea
                                    id="project-urls"
                                    value={urls}
                                    onChange={(e) => setUrls(e.target.value)}
                                    rows={10}
                                    disabled={isSaving}
                                    className="w-full border rounded p-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 custom-scrollbar resize-none h-64"
                                    placeholder="https://vk.com/club12345&#10;https://vk.ru/club236229266&#10;https://vk.com/durov"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Поиск по названию, ссылке или ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        title="Сбросить поиск"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 pb-1 border-b border-gray-100">
                                <span>Найдено: {filteredGroups.length}</span>
                                <button onClick={handleSelectAll} className="text-indigo-600 hover:text-indigo-800 font-medium">
                                    {selectedGroupIds.size === filteredGroups.length && filteredGroups.length > 0 ? 'Снять выделение' : 'Выбрать все'}
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto custom-scrollbar border border-gray-200 rounded-md bg-gray-50">
                                {isLoadingGroups ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="loader border-t-indigo-500 w-8 h-8"></div>
                                    </div>
                                ) : filteredGroups.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400 p-4 text-center">
                                        {adminGroups.length === 0 
                                            ? 'Список пуст. Перейдите в "Администрируемые" и нажмите "Обновить список", чтобы загрузить данные.' 
                                            : 'Ничего не найдено'}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {filteredGroups.map(group => (
                                            <div 
                                                key={group.id} 
                                                className={`flex items-center p-3 hover:bg-indigo-50 cursor-pointer transition-colors ${selectedGroupIds.has(group.id) ? 'bg-indigo-50' : 'bg-white'}`}
                                                onClick={() => handleToggleGroup(group.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGroupIds.has(group.id)}
                                                    onChange={() => handleToggleGroup(group.id)}
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3 pointer-events-none"
                                                />
                                                {group.photo_200 ? (
                                                    <GroupAvatar src={group.photo_200} />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex-shrink-0"></div>
                                                )}
                                                <div className="flex-grow min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">ID: {group.id}</p>
                                                </div>
                                                {group.members_count !== undefined && group.members_count > 0 && (
                                                    <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {group.members_count.toLocaleString()} уч.
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>
                    )}
                </main>
                <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50 flex-shrink-0 rounded-b-lg">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50">Отмена</button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || (activeTab === 'urls' && !urls.trim()) || (activeTab === 'database' && selectedGroupIds.size === 0)}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-wait w-32 flex justify-center items-center"
                    >
                        {isSaving ? (
                            <div className="loader border-white border-t-transparent h-4 w-4"></div>
                        ) : (
                            activeTab === 'database' && selectedGroupIds.size > 0 
                                ? `Добавить — ${selectedGroupIds.size}` 
                                : 'Добавить'
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};
