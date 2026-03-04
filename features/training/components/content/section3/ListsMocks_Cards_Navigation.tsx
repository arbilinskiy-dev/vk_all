// =====================================================================
// MOCK КОМПОНЕНТ: СЕТКА КАРТОЧЕК С ГРУППИРОВКОЙ
// =====================================================================

import React from 'react';
import type { ListType, ListGroup } from './ListsMocks_Cards_Types';
import { getListCardData } from './ListsMocks_Cards_Data';
import { MockListCard } from './ListsMocks_Cards_MockListCard';

interface MockListsNavigationProps {
    activeGroup?: ListGroup;
    selectedList?: ListType | null;
    onGroupChange?: (group: ListGroup) => void;
    onListSelect?: (list: ListType) => void;
}

export const MockListsNavigation: React.FC<MockListsNavigationProps> = ({
    activeGroup = 'subscribers',
    selectedList = null,
    onGroupChange,
    onListSelect
}) => {
    const allLists = getListCardData();
    const filteredLists = allLists.filter(list => list.group === activeGroup);

    // Названия групп
    const groupTitles: Record<ListGroup, string> = {
        subscribers: 'Подписчики',
        activities: 'Активности',
        automations: 'Автоматизации',
        other: 'Прочее'
    };

    return (
        <div className="space-y-4">
            {/* Табы групп */}
            <div className="flex gap-4 border-b border-gray-200">
                {(Object.keys(groupTitles) as ListGroup[]).map(group => (
                    <button
                        key={group}
                        onClick={() => onGroupChange?.(group)}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            activeGroup === group
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {groupTitles[group]}
                    </button>
                ))}
            </div>

            {/* Сетка карточек */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLists.map(list => (
                    <MockListCard
                        key={list.type}
                        data={list}
                        isActive={selectedList === list.type}
                        onClick={() => onListSelect?.(list.type)}
                    />
                ))}
            </div>
        </div>
    );
};
