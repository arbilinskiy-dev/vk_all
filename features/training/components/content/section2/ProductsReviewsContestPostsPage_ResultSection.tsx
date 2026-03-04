import React, { useState } from 'react';
import { Sandbox } from '../shared';
import { MockResultModal } from './ProductsReviewsContestPostsPage_Mocks';
import type { ResultType } from './ProductsReviewsContestPostsPage_Types';

// =====================================================================
// Секция «Окно результата розыгрыша» + Sandbox 3 (демо модалки)
// =====================================================================

export const ResultModalSection: React.FC = () => {
    // Состояние модалки — локальное для этой секции
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<ResultType>('success');

    return (
        <>
            <section>
                <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Окно с результатом розыгрыша</h2>
                <p className="!text-base !leading-relaxed !text-gray-700">
                    После нажатия кнопки "Подвести итоги" появляется всплывающее окно с одним из трёх вариантов результата:
                </p>

                <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">✅ Успех</h3>
                <ul className="!text-base !leading-relaxed !text-gray-700">
                    <li>Зелёная иконка галочки</li>
                    <li>Отображается имя победителя</li>
                    <li>Кнопка "Открыть пост с итогами" ведёт на опубликованный пост в VK</li>
                    <li>Указано, что приз отправлен (детали в журнале отправки)</li>
                </ul>

                <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">⏰ Розыгрыш перенесён</h3>
                <ul className="!text-base !leading-relaxed !text-gray-700">
                    <li>Жёлтая иконка часов</li>
                    <li>Сообщение "Условия завершения не выполнены"</li>
                    <li>Конкурс продолжится до следующего запуска</li>
                    <li>Такое происходит, если не набрано нужное количество участников</li>
                </ul>

                <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">❌ Ошибка</h3>
                <ul className="!text-base !leading-relaxed !text-gray-700">
                    <li>Красная иконка восклицательного знака</li>
                    <li>Список возможных причин ошибки</li>
                    <li>Чаще всего: закончились промокоды или все участники в чёрном списке</li>
                </ul>
            </section>

            {/* Sandbox 3: Всплывающее окно */}
            <Sandbox
                title="🏆 Демонстрация окна результата"
                description="Нажмите на кнопки ниже, чтобы увидеть разные варианты результата подведения итогов."
                instructions={[
                    '<strong>Кликните</strong> "Показать успех" — увидите окно с именем победителя',
                    '<strong>Кликните</strong> "Показать перенос" — увидите сообщение о переносе',
                    '<strong>Кликните</strong> "Показать ошибку" — увидите список возможных причин',
                    '<strong>Закройте</strong> окно кнопкой или кликом вне области'
                ]}
            >
                <div className="flex gap-3 flex-wrap">
                    <button 
                        onClick={() => { setModalType('success'); setShowModal(true); }}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
                    >
                        Показать успех
                    </button>
                    <button 
                        onClick={() => { setModalType('skipped'); setShowModal(true); }}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
                    >
                        Показать перенос
                    </button>
                    <button 
                        onClick={() => { setModalType('error'); setShowModal(true); }}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                        Показать ошибку
                    </button>
                </div>
                {showModal && <MockResultModal type={modalType} onClose={() => setShowModal(false)} />}
            </Sandbox>
        </>
    );
};
