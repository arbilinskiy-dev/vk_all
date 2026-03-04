/**
 * Секция «Настройки» страницы обучения «Конкурс отзывов».
 * Содержит интерактивные Sandbox-демо: основные настройки, условия завершения,
 * редактор шаблонов и предпросмотр сообщений в стиле VK.
 * Весь локальный state инкапсулирован внутри секции.
 */
import React, { useState } from 'react';
import { Sandbox } from '../shared';
import {
    VK_COLORS,
    ToggleSwitch,
    SegmentedControl,
    VkPost,
    VkComment,
    VkMessage,
    RichTemplateEditor
} from './ReviewsContestMocks';

export const SettingsSection: React.FC = () => {
    // Локальный state для интерактивных примеров
    const [isContestActive, setIsContestActive] = useState(true);
    const [autoBlacklist, setAutoBlacklist] = useState(false);
    const [finishCondition, setFinishCondition] = useState<'count' | 'date' | 'mixed'>('count');
    const [template, setTemplate] = useState('Спасибо за отзыв! Вы — участник №{number} 🎉');

    return (
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Вкладка "Настройки"</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Эта вкладка разделена на две части: <strong>слева — настройки конкурса</strong>, <strong>справа — предпросмотр</strong> того, 
                как будут выглядеть сообщения участникам.
            </p>

            {/* ── Основные настройки ── */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Основные настройки</h3>
            <Sandbox
                title="Интерактивный пример: Включение конкурса"
                description="Попробуйте включить/выключить конкурс и настроить автоматическое добавление в черный список."
                instructions={[
                    'Переключите <strong>статус конкурса</strong> (активен/неактивен)',
                    'Включите <strong>авто-добавление в ЧС</strong> — победитель автоматически будет заблокирован на N дней'
                ]}
            >
                <div className="bg-white rounded-lg border border-gray-300 p-6 space-y-6">
                    <ToggleSwitch 
                        isActive={isContestActive}
                        onChange={setIsContestActive}
                        label="Конкурс активен"
                    />

                    {isContestActive && (
                        <div className="space-y-4 animate-fade-in-up">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ключевое слово</label>
                                <input 
                                    type="text" 
                                    value="#отзыв" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-indigo-700 text-sm"
                                    readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">Посты с этим словом будут участвовать в конкурсе</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала</label>
                                <input 
                                    type="date" 
                                    value="2026-02-18" 
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">Посты до этой даты не будут учитываться</p>
                            </div>

                            <ToggleSwitch 
                                isActive={autoBlacklist}
                                onChange={setAutoBlacklist}
                                label="Авто-добавление в ЧС после победы"
                            />

                            {autoBlacklist && (
                                <div className="ml-6 animate-fade-in-up">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">На сколько дней</label>
                                    <input 
                                        type="number" 
                                        value={7} 
                                        min={1}
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center font-bold text-sm no-spinners"
                                        readOnly
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Победитель не сможет участвовать повторно в течение этого времени</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Sandbox>

            {/* ── Условия завершения ── */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Условия завершения конкурса</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Вы можете выбрать <strong>один из трёх режимов</strong>, когда система автоматически подведёт итоги:
            </p>

            <Sandbox
                title="Интерактивный пример: Условия завершения"
                description="Выберите режим завершения конкурса и посмотрите, какие настройки доступны для каждого."
                instructions={[
                    'Переключайте между режимами: <strong>🎉 По количеству</strong>, <strong>📅 В определенный день</strong>, <strong>⚖️ Смешанный</strong>',
                    'Обратите внимание, как меняются доступные настройки'
                ]}
            >
                <div className="bg-white rounded-lg border border-gray-300 p-6 space-y-6">
                    <SegmentedControl value={finishCondition} onChange={setFinishCondition} />

                    <div className="min-h-[12rem] bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {finishCondition === 'count' && (
                            <div className="animate-fade-in-up">
                                <p className="text-2xl mb-3">🎉</p>
                                <p className="font-semibold text-gray-800 mb-2">Подведение по количеству участников</p>
                                <div className="flex items-center gap-3 mb-3">
                                    <label className="text-sm text-gray-700">Целевое количество:</label>
                                    <input 
                                        type="number" 
                                        value={50} 
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center font-bold no-spinners"
                                        readOnly
                                    />
                                </div>
                                <p className="text-sm text-gray-600 bg-white rounded p-3 border border-gray-200">
                                    Пост с итогами опубликуется <strong>автоматически</strong>, как только наберется 50 участников
                                </p>
                            </div>
                        )}

                        {finishCondition === 'date' && (
                            <div className="animate-fade-in-up">
                                <p className="text-2xl mb-3">📅</p>
                                <p className="font-semibold text-gray-800 mb-2">Подведение в определенный день</p>
                                <div className="space-y-3 mb-3">
                                    <div>
                                        <label className="text-sm text-gray-700 block mb-2">День недели:</label>
                                        <div className="flex gap-2">
                                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
                                                <button 
                                                    key={idx}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                        idx === 4 
                                                            ? 'bg-indigo-600 text-white' 
                                                            : 'bg-white border border-gray-300 text-gray-700'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-700 block mb-2">Время:</label>
                                        <input 
                                            type="time" 
                                            value="18:00" 
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-white rounded p-3 border border-gray-200">
                                    Итоги подведутся каждую <strong>пятницу в 18:00</strong>, независимо от количества участников
                                </p>
                            </div>
                        )}

                        {finishCondition === 'mixed' && (
                            <div className="animate-fade-in-up">
                                <p className="text-2xl mb-3">⚖️</p>
                                <p className="font-semibold text-gray-800 mb-2">Смешанный режим</p>
                                <div className="space-y-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-gray-700">Минимум участников:</label>
                                        <input 
                                            type="number" 
                                            value={30} 
                                            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center font-bold no-spinners"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-700 block mb-2">Проверка каждую:</label>
                                        <div className="flex gap-2">
                                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
                                                <button 
                                                    key={idx}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                        idx === 4 
                                                            ? 'bg-indigo-600 text-white' 
                                                            : 'bg-white border border-gray-300 text-gray-700'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-white rounded p-3 border border-gray-200">
                                    Каждую <strong>пятницу</strong> система проверит: если набралось 30+ участников — подведет итоги. 
                                    Если нет — перенесет на следующую пятницу
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Sandbox>

            {/* ── Шаблоны сообщений ── */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Шаблоны сообщений</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Система использует <strong>4 типа шаблонов</strong> для общения с участниками. 
                В каждом шаблоне можно использовать <strong>переменные</strong> (например, <code>{'{number}'}</code> или <code>{'{promo_code}'}</code>), 
                которые автоматически заменятся на реальные значения.
            </p>

            <Sandbox
                title="Интерактивный пример: Редактор шаблона"
                description="Попробуйте отредактировать шаблон комментария. Переменные выделены цветом."
                instructions={[
                    'Измените текст в поле редактора',
                    'Нажмите на кнопку <code>{number}</code>, чтобы вставить переменную "Номер участника"',
                    'Посмотрите на предпросмотр ниже — переменная будет заменена на реальное значение'
                ]}
            >
                <div className="space-y-4">
                    <RichTemplateEditor
                        label="Шаблон комментария (Регистрация)"
                        value={template}
                        onChange={setTemplate}
                        helpText="Этот комментарий будет отправлен под публикацией участника"
                        specificVariables={[
                            { name: 'Номер', value: '{number}' }
                        ]}
                    />

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Предпросмотр (как увидит участник):</p>
                        <p className="text-sm text-gray-800 bg-white rounded p-3 border border-purple-200">
                            {template.replace('{number}', '42')}
                        </p>
                    </div>
                </div>
            </Sandbox>

            <div className="not-prose my-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">📋 Доступные шаблоны:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li><strong>Комментарий регистрации:</strong> Отправляется под постом участника. Переменная: <code>{'{number}'}</code></li>
                    <li><strong>Сообщение победителю (ЛС):</strong> Отправляется в личные сообщения. Переменные: <code>{'{promo_code}'}</code>, <code>{'{description}'}</code>, <code>{'{user_name}'}</code></li>
                    <li><strong>Ошибка отправки (Комментарий):</strong> Если ЛС закрыто, промокод публикуется в комментарии. Переменная: <code>{'{user_name}'}</code></li>
                    <li><strong>Пост с итогами:</strong> Публикуется на стене сообщества. Переменная: <code>{'{winners_list}'}</code></li>
                </ul>
            </div>

            {/* ── Предпросмотр в стиле VK ── */}
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Предпросмотр в стиле VK</h3>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Справа от настроек отображаются <strong>3 сценария</strong> того, как будут выглядеть сообщения во ВКонтакте:
            </p>

            {/* Сценарий 1: Пост участника и ответ */}
            <Sandbox
                title="Сценарий 1: Пост участника и ваш ответ"
                description="Так выглядит регистрация участника — система находит пост с ключевым словом и оставляет комментарий."
            >
                <div style={{ backgroundColor: VK_COLORS.bg }} className="p-6 rounded-lg">
                    <VkPost
                        authorName="Мария Смирнова"
                        date="сегодня в 14:30"
                        text={`Вчера заказали пиццу, очень понравилось! Тесто тонкое, начинки много.\n\n#отзыв`}
                        highlightWord="#отзыв"
                        blurredExtras={true}
                    >
                        <VkComment
                            isGroup
                            authorName="Пиццерия Вкусно"
                            text={template.replace('{number}', '42')}
                            date="сегодня в 14:35"
                            replyToName="Мария"
                        />
                    </VkPost>
                </div>
            </Sandbox>

            {/* Сценарий 2: Объявление итогов */}
            <Sandbox
                title="Сценарий 2: Объявление итогов"
                description="После подведения итогов на стене сообщества публикуется пост с победителями."
            >
                <div style={{ backgroundColor: VK_COLORS.bg }} className="p-6 rounded-lg">
                    <VkPost
                        isGroup
                        authorName="Пиццерия Вкусно"
                        date="только что"
                        text={`🎉 Итоги конкурса отзывов!\n\nСпасибо всем за участие! Победитель:\n\n1. Мария Смирнова (№42)\n\nПромокод уже отправлен в личные сообщения. Поздравляем! 🎁`}
                        blurredExtras={true}
                    />
                </div>
            </Sandbox>

            {/* Сценарий 3: Вручение приза */}
            <Sandbox
                title="Сценарий 3: Вручение приза"
                description="Промокод отправляется победителю в личные сообщения. Если ЛС закрыто — публикуется комментарий под его постом."
            >
                <div style={{ backgroundColor: VK_COLORS.bg }} className="p-6 rounded-lg space-y-4">
                    <div className="text-xs text-gray-500 italic text-right">Пример с кодом: WIN_X7Z</div>
                    <VkMessage
                        authorName="Пиццерия Вкусно"
                        text={`Поздравляем, Мария! 🎉\n\nВы победили в конкурсе отзывов!\nВаш промокод: WIN_X7Z\nПриз: Сет роллов "Филадельфия"\n\nПокажите этот код при заказе.`}
                        date="14:40"
                        blurredExtras={true}
                    />

                    <div className="text-center text-xs text-gray-500 py-2 border-t border-gray-300">
                        Если ЛС закрыто (Fallback):
                    </div>

                    <VkPost
                        authorName="Мария Смирнова"
                        date="сегодня в 14:30"
                        text={`Вчера заказали пиццу, очень понравилось! Тесто тонкое, начинки много.\n\n#отзыв`}
                        blurredExtras={true}
                    >
                        <VkComment
                            isGroup
                            authorName="Пиццерия Вкусно"
                            text={`Мария, поздравляем! 🎉 Не удалось отправить промокод в ЛС. Ваш код: WIN_X7Z`}
                            date="только что"
                            replyToName="Мария"
                        />
                    </VkPost>
                </div>
            </Sandbox>
        </section>
    );
};
