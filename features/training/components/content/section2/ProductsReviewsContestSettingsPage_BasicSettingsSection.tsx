/**
 * Секция «Основные настройки» + интерактивная песочница переключателя активности.
 *
 * Содержит:
 *   - Переключатель активности механики
 *   - Ключевое вхождение (хештег)
 *   - Дата начала сбора
 *   - Автоматический бан победителя
 *   - Sandbox: переключатель активности
 */
import React from 'react';
import { Sandbox } from '../shared';
import { ToggleSwitch } from './ReviewsContestMocks';

// =====================================================================
// Пропсы секции — всё состояние прокидывается из хаба
// =====================================================================
export interface BasicSettingsSectionProps {
    isActive: boolean;
    setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
    keywords: string;
    setKeywords: React.Dispatch<React.SetStateAction<string>>;
    autoBlacklist: boolean;
    setAutoBlacklist: React.Dispatch<React.SetStateAction<boolean>>;
    blacklistDuration: number;
    setBlacklistDuration: React.Dispatch<React.SetStateAction<number>>;
}

// =====================================================================
// Блок 1: Основные настройки + Sandbox
// =====================================================================
export const BasicSettingsSection: React.FC<BasicSettingsSectionProps> = ({
    isActive, setIsActive,
    keywords, setKeywords,
    autoBlacklist, setAutoBlacklist,
    blacklistDuration, setBlacklistDuration,
}) => (
    <>
        {/* ===== БЛОК 1: ОСНОВНЫЕ НАСТРОЙКИ ===== */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Блок 1: Основные настройки
            </h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Первый блок содержит самые важные параметры запуска конкурса:
            </p>

            <div className="not-prose mt-6 space-y-6">
                {/* Переключатель активности */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">⚙️ Активность механики</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Включите, чтобы система начала автоматически собирать и обрабатывать новые отзывы. Выключите — сбор остановится.
                            </p>
                        </div>
                        <ToggleSwitch enabled={isActive} onChange={() => setIsActive(!isActive)} />
                    </div>
                    {isActive && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                            ✓ Конкурс активен, система ищет новых участников
                        </div>
                    )}
                </div>

                {/* Ключевое вхождение */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-2">🔍 Ключевое вхождение</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Слово или хештег, по которому система ищет отзывы. Обычно это хештег с упоминанием сообщества, чтобы участники писали его в отзывах.
                    </p>
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        placeholder="#отзыв@club12345"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Пример: <code className="bg-gray-100 px-1 py-0.5 rounded">#отзыв@club12345</code> — участники пишут это в своих отзывах на товары
                    </p>
                </div>

                {/* Начало сбора */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-2">📅 Начало сбора</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Дата, с которой учитываются отзывы. Отзывы, написанные до этой даты, не попадут в конкурс.
                    </p>
                    <div className="inline-block border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm">
                        📆 15.02.2026
                    </div>
                </div>

                {/* Автоматический бан победителя */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">🚫 Автоматический бан победителя</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Добавлять победителя в черный список после выигрыша, чтобы он не участвовал повторно в следующих розыгрышах.
                            </p>
                        </div>
                        <ToggleSwitch enabled={autoBlacklist} onChange={() => setAutoBlacklist(!autoBlacklist)} />
                    </div>
                    
                    {autoBlacklist && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Срок блокировки (дней)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    value={blacklistDuration}
                                    onChange={(e) => setBlacklistDuration(Math.max(1, Number(e.target.value)))}
                                    className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                />
                                <span className="text-sm text-gray-600">дней</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Пользователь будет автоматически удален из черного списка через {blacklistDuration} {blacklistDuration === 1 ? 'день' : blacklistDuration < 5 ? 'дня' : 'дней'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>

        <hr className="!my-10" />

        {/* ===== ИНТЕРАКТИВНЫЙ ПРИМЕР: ПЕРЕКЛЮЧАТЕЛЬ АКТИВНОСТИ ===== */}
        <Sandbox
            title="🎮 Попробуйте: Переключатель активности"
            description="Этот переключатель управляет работой всей механики конкурса. Попробуйте включить и выключить конкурс."
            instructions={[
                'Нажмите на переключатель, чтобы увидеть изменение состояния',
                'Когда конкурс активен, переключатель становится синим',
                'В реальном приложении изменения сохраняются на сервере'
            ]}
        >
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">Конкурс отзывов активен</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isActive 
                                ? 'Система активно ищет новых участников по ключевым словам' 
                                : 'Конкурс остановлен, новые участники не собираются'}
                        </p>
                    </div>
                    <ToggleSwitch enabled={isActive} onChange={() => setIsActive(!isActive)} />
                </div>
            </div>
        </Sandbox>
    </>
);
