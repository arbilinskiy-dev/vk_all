import React, { useState } from 'react';

// ============================================
// Интерактивные демо-компоненты (со стейтом)
// ============================================

/**
 * Демо формы загрузки промокодов — вставка из Excel с автоматическим
 * преобразованием табуляции в формат «КОД | ОПИСАНИЕ».
 */
export const PromocodesUploadFormDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  /** Обработка вставки из буфера: замена табуляции на разделитель */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\t')) {
      e.preventDefault();
      const formatted = text.split('\n')
        .map(line => line.replace('\t', ' | '))
        .join('\n');
      setInputValue(formatted);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 max-w-md mx-auto">
      <h3 className="font-semibold text-gray-800 mb-2">Загрузка кодов</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">Формат загрузки:</p>
        <p className="font-mono bg-white/50 p-1 rounded mb-1">КОД | ОПИСАНИЕ ПРИЗА</p>
        <p>Каждая пара с новой строки. Описание будет использовано в переменной <code>{'{description}'}</code>.</p>
        <p className="mt-2 text-blue-600 italic">💡 Совет: Вы можете скопировать два столбца прямо из Excel и вставить сюда — формат исправится автоматически.</p>
      </div>

      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPaste={handlePaste}
        className="w-full h-32 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3 custom-scrollbar font-mono resize-none"
        placeholder="PROMO123 | Скидка 500р&#10;PROMO456 | Сет роллов&#10;WIN_777 | Пицца в подарок"
      />

      <button
        disabled={!inputValue.trim()}
        className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Загрузить в базу
      </button>

      {inputValue.includes('|') && (
        <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
          ✓ Формат распознан правильно
        </p>
      )}
    </div>
  );
};

/**
 * Демо редактирования описания приза: наведение → карандаш → инлайн-редактор.
 * Enter = сохранить, Escape = отменить.
 */
export const EditDescriptionDemo: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('Скидка 500 рублей');
  const [savedValue, setSavedValue] = useState('Скидка 500 рублей');

  const handleSave = () => {
    setSavedValue(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(savedValue);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="space-y-4">
        {/* Редактируемая строка */}
        <div className="p-3 border border-indigo-200 rounded bg-indigo-50/30">
          <div className="flex items-center gap-2 text-sm">
            <code className="font-mono font-bold">PROMO123</code>
            <span className="text-gray-400">→</span>
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  autoFocus
                />
                <button onClick={handleSave} className="text-green-600 hover:text-green-800 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={handleCancel} className="text-red-500 hover:text-red-700 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 group/edit">
                <span className="text-gray-700">{savedValue}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover/edit:opacity-100 transition-opacity"
                  title="Редактировать описание"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Свободен</span>
          </div>
        </div>

        {/* Заблокированная строка */}
        <div className="p-3 border border-gray-200 rounded bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            <code className="font-mono font-bold">WIN2024</code>
            <span className="text-gray-400">→</span>
            <span className="text-gray-500">Бесплатная доставка</span>
            <span className="text-gray-400 text-xs italic ml-auto">🔒 Редактирование заблокировано</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Выдан</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <p><strong>Как редактировать:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
          <li>Наведите курсор на описание — появится иконка карандаша</li>
          <li>Кликните на иконку или на само описание</li>
          <li>Нажмите <kbd className="bg-white px-1 rounded">Enter</kbd> для сохранения</li>
          <li>Нажмите <kbd className="bg-white px-1 rounded">Escape</kbd> для отмены</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Демо множественного выделения и удаления промокодов с чекбоксами.
 */
export const MultipleSelectionDemo: React.FC = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  /** Мок-данные промокодов */
  const promocodes = [
    { id: '1', code: 'PROMO123', isFree: true },
    { id: '2', code: 'WIN2024', isFree: true },
    { id: '3', code: 'SALE777', isFree: false },
    { id: '4', code: 'GIFT999', isFree: true }
  ];

  const freePromocodes = promocodes.filter(p => p.isFree);

  /** Переключение выбора одного промокода */
  const toggleSelection = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
    setAllSelected(newSet.size === freePromocodes.length);
  };

  /** Переключение выбора всех свободных промокодов */
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      setAllSelected(false);
    } else {
      setSelected(new Set(freePromocodes.map(p => p.id)));
      setAllSelected(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">База промокодов</span>
          {selected.size > 0 && (
            <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-200 transition-colors">
              Удалить выбранные ({selected.size})
            </button>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 w-10 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-gray-300 text-indigo-600 cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 text-left">Код</th>
            <th className="px-4 py-3 text-left">Статус</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {promocodes.map(promo => (
            <tr key={promo.id} className={`hover:bg-gray-50 transition-colors ${selected.has(promo.id) ? 'bg-indigo-50' : ''}`}>
              <td className="px-4 py-3 text-center">
                {promo.isFree ? (
                  <input
                    type="checkbox"
                    checked={selected.has(promo.id)}
                    onChange={() => toggleSelection(promo.id)}
                    className="rounded border-gray-300 text-indigo-600 cursor-pointer"
                  />
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono font-medium">
                {promo.code}
              </td>
              <td className="px-4 py-3">
                {promo.isFree ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Свободен</span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Выдан</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        💡 Чекбокс в шапке выделяет все <strong>свободные</strong> промокоды ({freePromocodes.length} шт.). Выданные коды нельзя выделить.
      </div>
    </div>
  );
};

/**
 * Демо предупреждения о нехватке промокодов: жёлтый баннер + настройки конкурса.
 */
export const ShortageWarningDemo: React.FC = () => {
  const [showWarning, setShowWarning] = useState(true);

  return (
    <div className="space-y-4">
      {showWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center justify-between animate-pulse">
          <div>
            <p className="font-semibold">⚠ Не хватает промокодов</p>
            <p className="text-sm mt-1">
              Свободно <strong>3 шт.</strong>, нужно минимум <strong>5</strong> (по количеству победителей в настройках).
            </p>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium text-sm"
          >
            Обновить
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Настройки конкурса</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Количество победителей:</span>
            <span className="font-bold text-gray-900">5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Свободных промокодов:</span>
            <span className={`font-bold ${showWarning ? 'text-red-600' : 'text-green-600'}`}>
              {showWarning ? '3' : '10'}
            </span>
          </div>
        </div>
      </div>

      {!showWarning && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✓ Достаточно промокодов для всех победителей
        </div>
      )}

      <button
        onClick={() => setShowWarning(true)}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Показать предупреждение снова
      </button>
    </div>
  );
};

/**
 * Демо пустого состояния, процесса загрузки и загруженных данных.
 * Переключение через кнопки: пустая база → загрузка → загружено.
 */
export const EmptyAndLoadingStatesDemo: React.FC = () => {
  const [state, setState] = useState<'empty' | 'loading' | 'loaded'>('empty');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setState('empty')}
          className={`px-3 py-1 text-xs rounded ${state === 'empty' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Пустая база
        </button>
        <button
          onClick={() => setState('loading')}
          className={`px-3 py-1 text-xs rounded ${state === 'loading' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Загрузка
        </button>
        <button
          onClick={() => setState('loaded')}
          className={`px-3 py-1 text-xs rounded ${state === 'loaded' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Загружено
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden" style={{ height: '250px' }}>
        <div className="p-4 border-b bg-gray-50">
          <span className="text-sm font-medium text-gray-700">База промокодов</span>
        </div>

        <div className="relative h-full">
          {state === 'empty' && (
            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
              <div>
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-400 italic">База промокодов пуста.</p>
                <p className="text-xs text-gray-500 mt-2">Загрузите коды через форму слева</p>
              </div>
            </div>
          )}

          {state === 'loading' && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Загрузка...</p>
              </div>
            </div>
          )}

          {state === 'loaded' && (
            <div className="p-4">
              <div className="space-y-2">
                {['PROMO123', 'WIN2024', 'SALE777'].map(code => (
                  <div key={code} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <code className="font-mono font-bold text-sm">{code}</code>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Свободен</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
