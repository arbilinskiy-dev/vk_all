import React from 'react';
import { Sandbox } from '../shared';
import { MockControlButtons } from './ProductsReviewsContestPostsPage_Mocks';

// =====================================================================
// Секция «Кнопки управления» + Sandbox 2 (демо кнопок)
// =====================================================================

export const ControlButtonsSection: React.FC = () => (
    <>
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Кнопки управления конкурсом</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                В правом верхнем углу таблицы расположены четыре кнопки для управления процессом:
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">🔄 Обновить</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Иконка с круговыми стрелками. Перезагружает список участников с сервера. При загрузке иконка вращается.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">💬 Прокомментировать (N)</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Зелёная кнопка с иконкой комментария. Присваивает номера всем участникам со статусом "Новый" и оставляет комментарии под их постами. Число в скобках показывает количество необработанных участников.
            </p>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Недоступна</strong>, если нет новых участников (число = 0)</li>
                <li>Во время работы показывает индикатор загрузки</li>
                <li>После успеха все обработанные участники получают статус "Принят"</li>
            </ul>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">⭐ Подвести итоги (N)</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Жёлтая кнопка с иконкой звезды. Выбирает случайного победителя из участников со статусом "Принят", публикует пост с итогами и отправляет приз. Число в скобках показывает количество участников, готовых к розыгрышу.
            </p>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Недоступна</strong>, если нет принятых участников</li>
                <li>Система автоматически исключает пользователей из черного списка</li>
                <li>После успеха показывает всплывающее окно с именем победителя</li>
            </ul>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">🔍 Собрать посты</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Синяя кнопка с иконкой лупы. Запускает автоматический сбор постов со стены сообщества по заданным ключевым словам. Все найденные посты добавляются в таблицу со статусом "Новый".
            </p>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li>Работает с учетом настроек конкурса (период, ключевые слова)</li>
                <li>Во время сбора показывает индикатор загрузки</li>
                <li>После завершения появляется уведомление и таблица обновляется</li>
            </ul>
        </section>

        {/* Sandbox 2: Кнопки управления */}
        <Sandbox
            title="🎮 Демонстрация кнопок управления"
            description="Попробуйте взаимодействовать с кнопками. Обратите внимание на состояния 'недоступно' и индикаторы загрузки."
            instructions={[
                '<strong>Кликните</strong> "Прокомментировать" — увидите индикатор загрузки',
                '<strong>Кликните</strong> "Собрать посты" — появится уведомление об успехе',
                '<strong>Обратите внимание</strong>: кнопки становятся недоступными при нулевом количестве участников'
            ]}
        >
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">
                        Новых участников: <strong>3</strong> • Готовых к розыгрышу: <strong>5</strong>
                    </div>
                </div>
                <MockControlButtons newCount={3} readyCount={5} />
            </div>
        </Sandbox>
    </>
);
