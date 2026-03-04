import React from 'react';

// =====================================================================
// Раздел 3: Расчётные показатели
// =====================================================================

export const CalculatedSection: React.FC = () => (
    <>
        {/* РАЗДЕЛ 3: РАСЧЁТНЫЕ ПОКАЗАТЕЛИ */}
        <hr className="!my-10" />
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">3. Расчётные показатели</h2>
        
        <p className="!text-base !leading-relaxed !text-gray-700">
            Дашборд автоматически рассчитывает три важных показателя эффективности. 
            Эти метрики помогают понять, насколько успешно работают ваши истории.
        </p>

        <div className="not-prose space-y-4 mt-6">
            {/* CTR */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-bold text-blue-900 mb-2">CTR (Click-Through Rate) — Кликабельность</h4>
                <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Формула:</strong> (Клики / Просмотры) × 100%</p>
                    <p><strong>Что показывает:</strong> Процент пользователей, которые перешли по ссылке после просмотра истории</p>
                    <p><strong>Пример:</strong> 1000 просмотров, 15 кликов → CTR = 1.5%</p>
                    <div className="bg-blue-100 rounded p-2 mt-2">
                        <p className="font-semibold">Как оценивать:</p>
                        <ul className="ml-4 mt-1 space-y-1">
                            <li>• Больше 1% — отличный результат</li>
                            <li>• 0.5-1% — хороший результат</li>
                            <li>• Меньше 0.5% — стоит улучшить призыв к действию или ссылку</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ER View */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                <h4 className="font-bold text-indigo-900 mb-2">ER View (Engagement Rate) — Вовлечённость</h4>
                <div className="space-y-2 text-sm text-indigo-800">
                    <p><strong>Формула:</strong> ((Лайки + Репосты + Ответы) / Просмотры) × 100%</p>
                    <p><strong>Что показывает:</strong> Процент пользователей, которые проявили активность (лайкнули, поделились или ответили)</p>
                    <p><strong>Пример:</strong> 1000 просмотров, 30 лайков, 5 репостов, 10 ответов → ER = 4.5%</p>
                    <div className="bg-indigo-100 rounded p-2 mt-2">
                        <p className="font-semibold">Как оценивать:</p>
                        <ul className="ml-4 mt-1 space-y-1">
                            <li>• 3-5% — отличная вовлечённость</li>
                            <li>• 1-3% — нормальная вовлечённость</li>
                            <li>• Меньше 1% — контент не заинтересовал аудиторию</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Эквивалент в рекламе */}
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                <h4 className="font-bold text-emerald-900 mb-2">Эквивалент в рекламе — Экономия бюджета</h4>
                <div className="space-y-2 text-sm text-emerald-800">
                    <p><strong>Формула:</strong> (Просмотры / 1000) × 150₽</p>
                    <p><strong>Что показывает:</strong> Примерная стоимость получения такого же охвата через таргетированную рекламу ВКонтакте</p>
                    <p><strong>CPM (Cost Per Mille):</strong> Стоимость 1000 показов рекламы ≈ 150₽ (средний показатель по рынку)</p>
                    <p><strong>Пример:</strong> 10,000 просмотров → (10,000 / 1000) × 150₽ = 1,500₽ сэкономлено</p>
                    <div className="bg-emerald-100 rounded p-2 mt-2">
                        <p className="font-semibold">Зачем нужно:</p>
                        <p className="mt-1">Помогает оценить реальную ценность органических историй. Показывает, сколько денег вы сэкономили, получив охват бесплатно через автоматизацию историй.</p>
                    </div>
                </div>
            </div>
        </div>
    </>
);
