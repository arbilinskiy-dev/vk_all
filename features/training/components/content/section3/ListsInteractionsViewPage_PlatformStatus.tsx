import React from 'react';
import { Sandbox } from '../shared';

// =====================================================================
// Секция «Бейджи платформ» + «Статусы аккаунтов» + «Дополнительные поля»
// =====================================================================

/** Блок 4 страницы «Просмотр взаимодействий» — платформы, статусы, доп. поля */
export const PlatformStatusSection: React.FC = () => (
    <>
        {/* ============================================== */}
        {/* 6. БЕЙДЖИ ПЛАТФОРМ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Бейджи платформ</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            В колонке "Онлайн" кроме даты последнего визита отображается <strong>цветной бейдж платформы</strong> — с какого устройства пользователь заходил в VK. ВКонтакте API возвращает числовой код платформы (1-7):
        </p>

        <Sandbox
            title="Все варианты бейджей платформ"
            description="Цветовая кодировка помогает быстро определить тип устройства"
        >
            <div className="text-center text-gray-500 py-8">
                <p>Интерактивная демонстрация бейджей платформ будет добавлена позже</p>
            </div>
        </Sandbox>

        <div className="not-prose bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg my-6">
            <h4 className="font-bold text-blue-900 mb-2">Зачем это нужно?</h4>
            <p className="text-sm text-blue-800">
                Понимание платформы помогает сегментировать аудиторию. Например, пользователи с мобильных устройств (m.vk, iPhone, Android) больше склонны к быстрым реакциям, а десктопные пользователи (Web) могут тратить больше времени на чтение и комментирование.
            </p>
        </div>

        {/* ============================================== */}
        {/* 7. СТАТУСЫ АККАУНТОВ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Статусы аккаунтов</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Колонка "Статус" показывает текущее состояние профиля пользователя. Всего 4 возможных статуса:
        </p>

        <Sandbox
            title="Все статусы аккаунтов"
            description="Цветовая индикация состояния профиля"
        >
            <div className="text-center text-gray-500 py-8">
                <p>Интерактивная демонстрация бейджей статусов будет добавлена позже</p>
            </div>
        </Sandbox>

        <div className="not-prose bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg my-6">
            <h4 className="font-bold text-red-900 mb-2">⚠️ Важно знать</h4>
            <p className="text-sm text-red-800">
                Удалённым и заблокированным пользователям <strong>нельзя отправлять сообщения</strong>. Если вы собираетесь делать рассылку активным пользователям, обязательно отфильтруйте такие аккаунты.
            </p>
        </div>

        {/* ============================================== */}
        {/* 8. ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Дополнительные поля профиля</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Кроме основной информации таблица содержит дополнительные поля, которые помогают лучше понять аудиторию:
        </p>

        <div className="not-prose my-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">Поле</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Описание</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-40">Возможные значения</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Пол</td>
                        <td className="px-4 py-3 text-gray-600">Пол пользователя согласно настройкам профиля</td>
                        <td className="px-4 py-3 text-gray-600">"Жен." / "Муж." / "—"</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">ДР</td>
                        <td className="px-4 py-3 text-gray-600">Дата рождения для расчёта возраста и таргетирования</td>
                        <td className="px-4 py-3 text-gray-600">"15.3.1995" / "—"</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Город</td>
                        <td className="px-4 py-3 text-gray-600">Город проживания пользователя (текстовое название)</td>
                        <td className="px-4 py-3 text-gray-600">"Москва" / "—"</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Онлайн</td>
                        <td className="px-4 py-3 text-gray-600">Дата и время последнего захода в VK + бейдж платформы</td>
                        <td className="px-4 py-3 text-gray-600">"25.02, 14:30" + бейдж</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">Иконка телефона</td>
                        <td className="px-4 py-3 text-gray-600">Маленькая серая иконка справа от ID — ВК знает номер телефона (показатель надёжности аккаунта)</td>
                        <td className="px-4 py-3 text-gray-600">Показывается / Скрыта</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </>
);
