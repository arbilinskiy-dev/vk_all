/**
 * Секция «Оптимизация и производительность» + «Итого»
 * Sticky заголовки, виртуализация, скроллбар, итоговый чеклист
 */
import React from 'react';

export const PerformanceAndSummarySection: React.FC = () => (
    <>
        {/* ===================================================================== */}
        {/* ПРОИЗВОДИТЕЛЬНОСТЬ */}
        {/* ===================================================================== */}
        <section>
            <h2>Оптимизация и производительность</h2>

            <h3>Sticky заголовки</h3>

            <p>
                Шапка таблицы (строка с названиями колонок) использует CSS свойство <code>position: sticky</code> 
                с <code>top: 0</code>. Это означает: при прокрутке таблицы вниз заголовки остаются наверху и не уезжают за экран.
            </p>

            <p>
                <strong>Зачем:</strong> Когда вы прокрутили на 200-го участника — вы всё равно видите что означает каждая колонка. 
                Не нужно прокручивать обратно вверх чтобы вспомнить где какие данные.
            </p>

            <h3>Виртуализация таблицы</h3>

            <p>
                Технически в DOM одновременно находится только 50-100 строк. Остальные данные хранятся в памяти JavaScript, 
                но не рендерятся в HTML. Когда вы прокручиваете — старые строки удаляются из DOM, новые добавляются.
            </p>

            <p>
                <strong>Зачем:</strong> Таблица на 10,000 строк в DOM — это катастрофа для производительности. Браузер не справится. 
                С виртуализацией — плавная прокрутка даже на 100,000 участников.
            </p>

            <h3>Горизонтальная прокрутка</h3>

            <p>
                Контейнер таблицы использует <code>overflow-x-auto</code>. Если ширина экрана меньше чем сумма всех колонок — 
                появляется горизонтальная прокрутка. Таблица не ломается, не обрезается, просто скроллится влево-вправо.
            </p>

            <p>
                <strong>Применение:</strong> На узких экранах (планшеты, маленькие ноутбуки) не все 9 колонок влезут. 
                Прокрутите вправо — увидите скрытые колонки.
            </p>

            <h3>Кастомный скроллбар</h3>

            <p>
                Таблица использует класс <code>custom-scrollbar</code> — это глобальный CSS, который стилизует полосу прокрутки:
            </p>

            <ul>
                <li><strong>Трек</strong> (фон полосы) — прозрачный</li>
                <li><strong>Ползунок</strong> — серый (#D1D5DB = Tailwind gray-300)</li>
                <li><strong>При наведении</strong> — тёмно-серый (#9CA3AF = Tailwind gray-400)</li>
                <li><strong>Ширина</strong> — 6 пикселей (тонкая полоса, не занимает много места)</li>
            </ul>

            <p>
                <strong>Зачем:</strong> Стандартные скроллбары браузера выглядят по-разному в Chrome, Firefox, Safari. 
                Кастомный скроллбар — единообразный внешний вид на всех платформах.
            </p>
        </section>

        {/* ===================================================================== */}
        {/* ИТОГИ */}
        {/* ===================================================================== */}
        <section>
            <h2>Итого</h2>

            <div className="not-prose bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 my-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Что важно запомнить:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>4 зоны интерфейса</strong> — панель фильтров, заголовки колонок (sticky), строки участников, индикатор загрузки</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>9 колонок данных</strong> — аватар, пользователь, пол, ДР, город, онлайн/платформа, статус, дата, источник</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>7 фильтров</strong> — статус, пол, онлайн, платформа, возраст, месяц рождения, сообщения (для рассылки)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>Поиск по 3 параметрам</strong> — имя, фамилия, VK ID (регистронезависимый, моментальный)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>Infinite scroll</strong> — по 50 записей, автоматическая подгрузка, без кнопок</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>3 состояния</strong> — загрузка (спиннер + текст), пустой список (иконка + подсказка), с данными (таблица)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>Бейджи</strong> — статус (зелёный/красный/серый), платформа (iOS/Android/Web/m.vk), источник (Callback/Диалог/Посты/Ручной)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>Модальное окно аватара</strong> — клик по фото → увеличенная версия, 3 способа закрыть</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span><strong>Для рассылки</strong> — 4 доп. колонки (ЛС, FC, Init, LC), кнопка «Анализ» с 3 опциями</span>
                    </li>
                </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-6">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-bold text-green-900 mb-1">Практический совет</h4>
                        <p className="text-sm text-green-800 mb-0">
                            Перед любой массовой рассылкой или конкурсом — откройте таблицу участников, примените фильтры 
                            «Активные» + «Онлайн: Неделя». Это ваша реальная живая аудитория. Забаненные и удалённые аккаунты — 
                            мёртвый груз, не тратьте на них время.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </>
);
