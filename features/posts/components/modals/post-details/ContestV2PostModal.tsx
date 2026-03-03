
import React from 'react';
import { UnifiedPost } from '../../../../schedule/hooks/useScheduleData';
import { SlidePanel } from '../../../../../shared/components/modals/SlidePanel';

// Специальное модальное окно для постов Конкурс 2.0
export const ContestV2PostModal: React.FC<{
    post: UnifiedPost;
    onClose: () => void;
    onGoToSettings: () => void;
}> = ({ post, onClose, onGoToSettings }) => {
    // Получаем данные поста
    const postDate = new Date(post.date);
    const dateStr = postDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = postDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Парсим изображения
    let images: { id: string; url: string }[] = [];
    if ('images' in post && post.images) {
        try {
            images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
        } catch { images = []; }
    }
    
    return (
        <SlidePanel isOpen={true} onClose={onClose} width="50vw">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                            КОНКУРС 2.0
                        </span>
                        <h2 className="text-lg font-semibold text-gray-800">Пост конкурса</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Закрыть">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <main className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Дата и время */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата и время</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                            {dateStr} в {timeStr}
                        </div>
                    </div>
                    
                    {/* Текст */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Текст публикации</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700 whitespace-pre-wrap min-h-[80px] max-h-[200px] overflow-y-auto">
                            {post.text || <span className="text-gray-400 italic">Текст не указан</span>}
                        </div>
                    </div>
                    
                    {/* Изображения */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Изображения ({images.length})</label>
                        {images.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                                {images.map((img, idx) => (
                                    <img 
                                        key={img.id || idx} 
                                        src={img.url} 
                                        alt="" 
                                        className="w-20 h-20 object-cover rounded-md border border-gray-200"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="px-3 py-4 bg-gray-50 border border-gray-200 rounded-md text-gray-400 text-center text-sm">
                                Изображения не добавлены
                            </div>
                        )}
                    </div>
                    
                    {/* Информационный блок */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-800">Этот пост связан с механикой Конкурс 2.0</p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Для редактирования текста, изображений или времени публикации перейдите в настройки механики.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 border-t bg-gray-50 flex justify-end">
                    <button 
                        onClick={onGoToSettings}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Перейти в настройки механики
                    </button>
                </footer>
        </SlidePanel>
    );
};
