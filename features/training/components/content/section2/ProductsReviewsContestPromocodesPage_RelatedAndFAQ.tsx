import React from 'react';
import { NavigationButtons } from '../shared';

// =====================================================================
// Секция: Связь с другими разделами + FAQ + Навигация
// =====================================================================
export const RelatedAndFAQ: React.FC = () => (
    <>
        {/* Связь с другими вкладками */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Связь с другими разделами</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Вкладка "Промокоды" работает в связке с остальными разделами конкурса:
        </p>

        <div className="not-prose my-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-700">1</div>
                    <div>
                        <p className="font-semibold text-gray-900">Настройки → Промокоды</p>
                        <p className="text-sm text-gray-600">В настройках вы пишете шаблон сообщения с переменной <code>{'{description}'}</code>. 
                        Эта переменная заменяется на описание из таблицы промокодов.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-700">2</div>
                    <div>
                        <p className="font-semibold text-gray-900">Промокоды → Победители</p>
                        <p className="text-sm text-gray-600">При выборе победителя система берёт первый свободный промокод из этой базы. 
                        Промокод становится "выдан" и появляется в таблице победителей.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-700">3</div>
                    <div>
                        <p className="font-semibold text-gray-900">Промокоды → Лист отправок</p>
                        <p className="text-sm text-gray-600">Если нужно посмотреть статус доставки промокода победителю (отправлен в ЛС или комментарий), 
                        используйте вкладку "Лист отправок". Там детальная информация о каждой попытке доставки.</p>
                    </div>
                </div>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Частые вопросы */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Частые вопросы</h2>

        <div className="not-prose space-y-4 my-6">
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Можно ли загрузить промокоды без описания?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Да, можно. Просто введите только коды, каждый с новой строки (без вертикальной черты). 
                    Описание будет пустым, но позже его можно добавить через редактирование.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Что происходит, если промокодов не хватает?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Система пропускает розыгрыш и пишет в логи сообщение об ошибке. 
                    Конкурс продолжит работать, но победитель не будет выбран до тех пор, пока вы не догрузите промокоды.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Можно ли удалить выданный промокод?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Нет, нельзя. Выданные промокоды нельзя удалять — это архивная информация о победителях. 
                    Удалять можно только свободные (не использованные) промокоды.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Как работает массовое удаление?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Отметьте чекбоксы у нужных промокодов (доступно только для свободных), 
                    затем нажмите кнопку "Удалить выбранные" в шапке таблицы. Появится окно подтверждения.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Зачем нужна иконка чата?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Иконка чата (три точки) открывает диалог ВКонтакте с победителем. 
                    Это удобно, если победитель написал вопрос о промокоде — не нужно искать его в сообщениях, просто кликните на иконку.
                </p>
            </details>
        </div>

        {/* Навигация */}
        <NavigationButtons currentPath="2-4-2-5-promocodes" />
    </>
);
