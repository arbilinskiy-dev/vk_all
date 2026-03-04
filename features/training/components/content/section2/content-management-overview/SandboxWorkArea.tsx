import React from 'react';
import { ActiveTab } from './_data';

// =====================================================================
// Sandbox: Колонка 3 — Рабочая область (Календарь / Предложенные / Товары)
// =====================================================================

interface SandboxWorkAreaProps {
    /** Текущая активная вкладка */
    activeTab: ActiveTab;
}

export const SandboxWorkArea: React.FC<SandboxWorkAreaProps> = ({ activeTab }) => (
    <div className="flex-1 bg-white border border-gray-300 rounded p-4 overflow-auto">
        {activeTab === 'schedule' && (
            <div>
                <div className="text-sm font-semibold text-gray-700 mb-3">Календарь отложенных постов</div>
                <div className="grid grid-cols-3 gap-2">
                    {/* День 1 - пусто */}
                    <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="text-center mb-2">
                            <p className="font-bold text-xs text-gray-700">Пн</p>
                            <p className="text-gray-500 text-xs">03.02</p>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center">
                            <svg className="w-4 h-4 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                    </div>
                    
                    {/* День 2 - с постом */}
                    <div className="border border-gray-200 rounded p-2 bg-white">
                        <div className="text-center mb-2">
                            <p className="font-bold text-xs text-indigo-600">Вт</p>
                            <p className="text-gray-500 text-xs font-semibold">04.02</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded p-2 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 mb-1">14:30</p>
                            <div className="aspect-video bg-gray-200 rounded mb-1">
                                <img src="https://picsum.photos/seed/demo1/200/113" alt="" className="w-full h-full object-cover rounded" />
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">Новое поступление товаров! 🎉</p>
                        </div>
                    </div>

                    {/* День 3 - с 2 постами */}
                    <div className="border border-gray-200 rounded p-2 bg-white">
                        <div className="text-center mb-2">
                            <p className="font-bold text-xs text-gray-700">Ср</p>
                            <p className="text-gray-500 text-xs">05.02</p>
                        </div>
                        <div className="space-y-1">
                            <div className="bg-white border border-gray-200 rounded p-1.5 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500">10:00</p>
                                <p className="text-xs text-gray-600 line-clamp-1">Утренний пост</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded p-1.5 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500">18:00</p>
                                <p className="text-xs text-gray-600 line-clamp-1">Вечерний пост</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'suggested' && (
            <div className="animate-fadeIn">
                <div className="text-sm font-semibold text-gray-700 mb-3">Список предложенных постов</div>
                <div className="space-y-3">
                    {/* Пост 1 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-2">
                                <a href="#" className="text-xs font-semibold text-gray-800 hover:text-indigo-600 truncate pr-2">
                                    Анна Белова
                                </a>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                    2 фев 2026
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">Отличный магазин! Заказывала уже несколько раз, всегда довольна качеством 😊</p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <a href="#" className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Посмотреть на VK
                                </a>
                                <button className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    Редактор AI
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Пост 2 с изображениями */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex gap-1 p-1">
                            <div className="w-1/2 aspect-video bg-gray-200 rounded overflow-hidden">
                                <img src="https://picsum.photos/seed/sug1/400/225" alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-1/2 aspect-video bg-gray-200 rounded overflow-hidden">
                                <img src="https://picsum.photos/seed/sug2/400/225" alt="" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-2">
                                <a href="#" className="text-xs font-semibold text-gray-800 hover:text-indigo-600 truncate pr-2">
                                    Иван Смирнов
                                </a>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                    3 фев 2026
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">Фото с вчерашнего мероприятия! 🎊</p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <a href="#" className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Посмотреть на VK
                                </a>
                                <button className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    Редактор AI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'products' && (
            <div className="animate-fadeIn">
                <div className="text-sm font-semibold text-gray-700 mb-3">Таблица товаров</div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Фото</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">New Фото</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Название</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Старая цена</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            <tr className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-2 py-2 align-top">
                                    <img src="https://picsum.photos/seed/prod1/40/40" alt="" className="w-10 h-10 rounded object-cover" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <div className="text-xs text-gray-400 italic">—</div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="text" value="Товар 1" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <textarea rows={2} value="Описание товара" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700 text-xs resize-none" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="number" value="1200" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="number" value="1500" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-500 line-through" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="text" value="SKU001" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700" readOnly />
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-2 py-2 align-top">
                                    <img src="https://picsum.photos/seed/prod2/40/40" alt="" className="w-10 h-10 rounded object-cover" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <div className="w-10 h-10 rounded border-2 border-dashed border-indigo-300 bg-indigo-50 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="text" value="Товар 2" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <textarea rows={2} value="Отличное качество" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700 text-xs resize-none" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="number" value="890" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <div className="text-xs text-gray-400 italic">—</div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="text" value="SKU002" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700" readOnly />
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-2 py-2 align-top">
                                    <img src="https://picsum.photos/seed/prod3/40/40" alt="" className="w-10 h-10 rounded object-cover" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <div className="text-xs text-gray-400 italic">—</div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="text" value="Товар 3" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <textarea rows={2} value="Новинка сезона" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700 text-xs resize-none" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="number" value="2500" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="number" value="3000" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-500 line-through" readOnly />
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <input type="text" value="SKU003" className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700" readOnly />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
);
