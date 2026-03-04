import React, { useState } from 'react';
import { Sandbox } from '../shared';

/**
 * Раздел 2: Пост конкурса —
 * выбор типа поста (отложенный или новый) и создание контента.
 */
const GeneralContestsSettingsPage_ContestPost: React.FC = () => {
  return (
    <>
      {/* РАЗДЕЛ 2: ПОСТ КОНКУРСА */}
      <h3>2. Пост конкурса</h3>
      <p>
        В этом блоке вы создаёте сам пост, который увидят участники. Можно выбрать готовый отложенный пост или создать новый прямо здесь.
      </p>

      <div className="not-prose my-6">
        <Sandbox title="Выбор типа поста">
          <PostTypeDemo />
        </Sandbox>
      </div>

      <p><strong>Два варианта работы:</strong></p>
      <ul>
        <li><strong>"Использовать отложенный пост"</strong> — если вы уже создали пост в разделе "Посты" и хотите использовать его</li>
        <li><strong>"Создать новый пост здесь"</strong> — если хотите написать текст и добавить фото/видео прямо в настройках конкурса</li>
      </ul>

      <div className="not-prose my-6">
        <Sandbox title="Создание нового поста с медиафайлами">
          <NewPostDemo />
        </Sandbox>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
        <p className="text-amber-800 m-0">
          <strong>Внимание:</strong> Если выберете "Использовать отложенный пост", убедитесь что пост уже создан в разделе "Посты" и добавлен в очередь публикации.
        </p>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_ContestPost;

// ────────────────────────────────────────
// Демо-компоненты раздела «Пост конкурса»
// ────────────────────────────────────────

/** Демо: переключатель типа поста (отложенный / новый) */
const PostTypeDemo: React.FC = () => {
  const [postType, setPostType] = useState<'deferred' | 'new'>('new');

  return (
    <div className="space-y-4 p-4">
      {/* Сегментированный контрол */}
      <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
        <button
          onClick={() => setPostType('deferred')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            postType === 'deferred'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Использовать отложенный пост
        </button>
        <button
          onClick={() => setPostType('new')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            postType === 'new'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Создать новый пост здесь
        </button>
      </div>

      {/* Контент в зависимости от выбора */}
      <div className="mt-4">
        {postType === 'deferred' ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 Выберите готовый пост из списка отложенных постов проекта
            </p>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 text-sm">
              ✍️ Создайте новый пост: добавьте текст, изображения и видео прямо здесь
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Демо: редактор нового поста с медиафайлами */
const NewPostDemo: React.FC = () => {
  const [postText, setPostText] = useState('');

  return (
    <div className="space-y-4 p-4">
      {/* Редактор текста */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Текст поста
        </label>
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder="🎉 Разыгрываем крутые призы! Условия участия:..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
      </div>

      {/* Кнопки добавления медиа */}
      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-lg">🖼️</span>
          <span className="text-sm font-medium text-gray-700">Добавить фото</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-lg">🎥</span>
          <span className="text-sm font-medium text-gray-700">Добавить видео</span>
        </button>
      </div>

      {/* Превью */}
      {postText && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Превью поста:</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{postText}</p>
        </div>
      )}
    </div>
  );
};
