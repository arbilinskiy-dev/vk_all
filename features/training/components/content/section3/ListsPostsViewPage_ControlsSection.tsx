/**
 * Разделы 8-10 страницы «Просмотр постов»
 * 8. Кнопка обновления
 * 9. Форматирование дат
 * 10. Превью изображения и модальное окно
 */
import React from 'react';

export const ControlsSection: React.FC = () => (
    <>
        {/* ============================================ */}
        {/* РАЗДЕЛ 8: КНОПКА ОБНОВЛЕНИЯ */}
        {/* ============================================ */}
        <h2>8. Кнопка обновления</h2>
        <p>
            Справа от поля поиска находится <strong>кнопка обновления списка постов</strong>. При клике 
            она отправляет запрос к API ВКонтакте, чтобы получить свежие данные по статистике.
        </p>

        <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-700 mb-2">Обычное состояние</div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-9 w-12 bg-white border border-gray-300 rounded-md text-gray-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-600">Иконка стрелок обновления</span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-700 mb-2">Во время загрузки</div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-9 w-12 bg-gray-100 border border-gray-300 rounded-md text-gray-400 opacity-50">
                        <div className="h-4 w-4 border-2 border-gray-400 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                    <span className="text-sm text-gray-600">Крутящийся индикатор</span>
                </div>
            </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
            <p className="text-sm text-amber-800 mb-0">
                <strong>⚠️ Важно:</strong> Во время обновления кнопка становится <strong>неактивной</strong> 
                (полупрозрачной), чтобы пользователь не мог запустить несколько обновлений одновременно.
            </p>
        </div>

        {/* ============================================ */}
        {/* РАЗДЕЛ 9: ФОРМАТИРОВАНИЕ ДАТ */}
        {/* ============================================ */}
        <h2>9. Форматирование дат</h2>
        <p>
            В таблице две даты: <strong>"Публ."</strong> (когда пост был опубликован в ВК) и 
            <strong>"Собрано"</strong> (когда последний раз обновлялась статистика). Обе даты 
            отображаются в формате <code className="bg-gray-100 px-2 py-1 rounded text-xs">ДД.МM.ГГГГ, ЧЧ:ММ</code>.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-4 my-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-sm font-bold text-gray-700 mb-2">Пример даты публикации:</div>
                    <div className="bg-gray-50 rounded px-3 py-2 text-sm font-mono text-gray-800">
                        15.02.2024, 14:23
                    </div>
                    <p className="text-xs text-gray-500 mt-2 mb-0">
                        Читается как: 15 февраля 2024 года в 14:23
                    </p>
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-700 mb-2">Исходный формат в БД:</div>
                    <div className="bg-gray-50 rounded px-3 py-2 text-sm font-mono text-gray-800">
                        1708828800 <span className="text-gray-400">(Unix timestamp)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 mb-0">
                        Преобразуется в читаемый формат на клиенте
                    </p>
                </div>
            </div>
        </div>

        {/* ============================================ */}
        {/* РАЗДЕЛ 10: ПРЕВЬЮ ИЗОБРАЖЕНИЯ */}
        {/* ============================================ */}
        <h2>10. Превью изображения и модальное окно</h2>
        <p>
            В колонке "Медиа" показывается <strong>уменьшенное изображение поста (40×40 пикселей)</strong>. 
            При наведении мышки превью слегка увеличивается. При клике — открывается полноразмерное изображение 
            в модальном окне.
        </p>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 my-6">
            <p className="text-sm text-indigo-800 mb-2"><strong>Механика модального окна:</strong></p>
            <ul className="text-sm text-indigo-800 mb-0 space-y-1">
                <li>Окно открывается <strong>поверх всего интерфейса</strong> (z-index 100)</li>
                <li>Фон затемняется чёрным полупрозрачным слоем (80% непрозрачности)</li>
                <li>Изображение масштабируется: максимум 85% высоты экрана</li>
                <li><strong>3 способа закрыть окно:</strong> кнопка ✕ в углу, клик вне изображения, клавиша ESC</li>
            </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 my-6">
            <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Превью в таблице (40×40px):</p>
                <div className="inline-block w-10 h-10 rounded overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    <img src="https://picsum.photos/seed/demo/400/400" alt="Превью" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-500 mt-3 mb-0">
                    При наведении изображение увеличивается на 110%
                </p>
            </div>
        </div>
    </>
);
