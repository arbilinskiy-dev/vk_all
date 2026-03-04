import React from 'react';
import { Sandbox } from '../shared';
import { MockSystemLogs } from './ProductsReviewsContestLogsPage_Mocks';

// =====================================================================
// Секция «Системные логи (терминал)» — объяснение + песочница
// =====================================================================

export const SystemLogsSection: React.FC = () => (
    <>
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Системные логи (терминал)
            </h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Системные логи отображаются в стиле <strong>терминала программиста</strong> — чёрный фон, цветные сообщения. Это техническая информация для отладки работы автоматизации.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Уровни логов и их значение
            </h3>
            <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-400 text-white text-xs font-mono rounded">INFO</span>
                        <span className="font-semibold text-blue-900">Информация</span>
                    </div>
                    <p className="text-sm text-blue-800">
                        Обычные действия системы: запуск сканера, публикация комментария, поиск постов
                    </p>
                </div>

                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-400 text-white text-xs font-mono rounded">SUCCESS</span>
                        <span className="font-semibold text-green-900">Успех</span>
                    </div>
                    <p className="text-sm text-green-800">
                        Успешные операции: найден новый пост, комментарий опубликован, победитель выбран
                    </p>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-400 text-white text-xs font-mono rounded">ERROR</span>
                        <span className="font-semibold text-red-900">Ошибка</span>
                    </div>
                    <p className="text-sm text-red-800">
                        Проблемы работы: ошибка VK API, не удалось опубликовать комментарий, превышен лимит запросов
                    </p>
                </div>

                <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-amber-400 text-white text-xs font-mono rounded">WARNING</span>
                        <span className="font-semibold text-amber-900">Предупреждение</span>
                    </div>
                    <p className="text-sm text-amber-800">
                        Важные события: пользователь в чёрном списке, пост пропущен, дубликат участника
                    </p>
                </div>
            </div>
        </section>

        {/* Песочница: Системные логи */}
        <div className="not-prose">
            <Sandbox
                title="🖥️ Интерактивная демонстрация: Системные логи"
                description="Так выглядит окно системных логов в реальном приложении. Записи появляются в реальном времени с временными метками."
                instructions={[
                    'Каждая запись содержит: <strong>время</strong>, <strong>уровень</strong> (INFO/SUCCESS/ERROR/WARNING) и <strong>описание события</strong>',
                    'Цвета помогают быстро увидеть проблемы: красный = ошибка, жёлтый = предупреждение',
                    'Кнопка <strong>"Clear"</strong> очищает окно логов (но не удаляет историю из базы)'
                ]}
            >
                <MockSystemLogs />
            </Sandbox>
        </div>
    </>
);
