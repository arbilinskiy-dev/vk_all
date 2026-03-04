/**
 * Секция «Условия подведения итогов» + интерактивная песочница режимов.
 *
 * Содержит:
 *   - Три режима завершения (по количеству / в определённый день / смешанный)
 *   - Sandbox: переключение между режимами с визуализацией
 */
import React from 'react';
import { Sandbox } from '../shared';
import { SegmentedControlMock, DaySelectorMock } from './ProductsReviewsContestSettingsPage_Mocks';

// =====================================================================
// Пропсы секции — всё состояние прокидывается из хаба
// =====================================================================
export interface FinishConditionsSectionProps {
    finishCondition: 'count' | 'date' | 'mixed';
    setFinishCondition: React.Dispatch<React.SetStateAction<'count' | 'date' | 'mixed'>>;
    targetCount: number;
    setTargetCount: React.Dispatch<React.SetStateAction<number>>;
    dayOfWeek: number;
    setDayOfWeek: React.Dispatch<React.SetStateAction<number>>;
}

/** Массив названий дней недели (Пн–Вс) */
const DAY_NAMES_FULL = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// =====================================================================
// Блок 2: Условия завершения + Sandbox
// =====================================================================
export const FinishConditionsSection: React.FC<FinishConditionsSectionProps> = ({
    finishCondition, setFinishCondition,
    targetCount, setTargetCount,
    dayOfWeek, setDayOfWeek,
}) => (
    <>
        {/* ===== БЛОК 2: УСЛОВИЯ ЗАВЕРШЕНИЯ ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Блок 2: Условия подведения итогов
            </h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Этот блок определяет, <strong>когда система автоматически подведет итоги конкурса</strong>. Есть три режима:
            </p>

            <div className="not-prose mt-6 space-y-6">
                {/* Переключатель режимов */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-3">Выберите режим завершения</h3>
                    <SegmentedControlMock value={finishCondition} onChange={(val) => setFinishCondition(val as any)} />
                </div>

                {/* Описание режимов */}
                {finishCondition === 'count' && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                        <h3 className="text-lg font-bold text-indigo-900 mb-3">🎉 По количеству</h3>
                        <p className="text-sm text-indigo-800 mb-4">
                            Итоги подводятся автоматически, как только в базе наберется указанное количество участников.
                        </p>
                        <div className="bg-white border border-indigo-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Целевое количество участников</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    value={targetCount}
                                    onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
                                    className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                />
                                <span className="text-sm text-gray-600">участников</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Пост с итогами опубликуется автоматически при достижении {targetCount} участников
                            </p>
                        </div>
                    </div>
                )}

                {finishCondition === 'date' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <h3 className="text-lg font-bold text-green-900 mb-3">📅 В определенный день</h3>
                        <p className="text-sm text-green-800 mb-4">
                            Итоги подводятся в указанный день недели и время, независимо от количества участников (если есть хотя бы один).
                        </p>
                        <div className="bg-white border border-green-200 rounded-lg p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">День недели</label>
                                <DaySelectorMock value={dayOfWeek} onChange={setDayOfWeek} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Время подведения</label>
                                <div className="inline-block border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm">
                                    🕐 10:00
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Итоги подведутся каждый {DAY_NAMES_FULL[dayOfWeek - 1]} в 10:00
                            </p>
                        </div>
                    </div>
                )}

                {finishCondition === 'mixed' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                        <h3 className="text-lg font-bold text-amber-900 mb-3">⚖️ День + Количество</h3>
                        <p className="text-sm text-amber-800 mb-4">
                            Итоги подводятся в указанный день, но только если набрано минимальное количество участников. Если нет — переносится на следующую неделю.
                        </p>
                        <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">День недели</label>
                                <DaySelectorMock value={dayOfWeek} onChange={setDayOfWeek} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Минимум участников</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={targetCount}
                                    onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
                                    className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Если в {DAY_NAMES_FULL[dayOfWeek - 1]} будет {targetCount}+ участников — проводим розыгрыш. Если нет — ждем следующей недели.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>

        <hr className="!my-10" />

        {/* ===== ИНТЕРАКТИВНЫЙ ПРИМЕР: РЕЖИМЫ ЗАВЕРШЕНИЯ ===== */}
        <Sandbox
            title="🎮 Попробуйте: Режимы завершения конкурса"
            description="Переключайте между режимами, чтобы увидеть, какие параметры становятся доступны для настройки."
            instructions={[
                'Выберите режим "По количеству" — появится поле для указания целевого числа участников',
                'Выберите "В определенный день" — увидите селектор дня недели и времени',
                'Режим "День + Количество" комбинирует оба условия'
            ]}
        >
            <div className="space-y-4">
                <SegmentedControlMock value={finishCondition} onChange={(val) => setFinishCondition(val as any)} />
                
                <div className="min-h-[8rem] bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                    {finishCondition === 'count' && (
                        <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600 mb-2">{targetCount}</p>
                            <p className="text-sm text-gray-600">участников до розыгрыша</p>
                        </div>
                    )}
                    {finishCondition === 'date' && (
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600 mb-2">
                                {DAY_NAMES_SHORT[dayOfWeek - 1]} в 10:00
                            </p>
                            <p className="text-sm text-gray-600">розыгрыш каждую неделю</p>
                        </div>
                    )}
                    {finishCondition === 'mixed' && (
                        <div className="text-center space-y-1">
                            <p className="text-lg font-bold text-amber-600">
                                {DAY_NAMES_SHORT[dayOfWeek - 1]} в 10:00
                            </p>
                            <p className="text-sm text-gray-600">если набрано минимум</p>
                            <p className="text-xl font-bold text-amber-700">{targetCount} участников</p>
                        </div>
                    )}
                </div>
            </div>
        </Sandbox>
    </>
);
