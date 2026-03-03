
import React from 'react';

export const getGridColsClass = (size: number) => {
    switch (size) {
        case 4: return 'grid-cols-4';
        case 5: return 'grid-cols-5';
        default: return 'grid-cols-3';
    }
};

export const GallerySkeleton: React.FC<{ gridSize: number }> = ({ gridSize }) => (
    <div className={`grid ${getGridColsClass(gridSize)} gap-3 animate-pulse`}>
        {Array.from({ length: gridSize * 3 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-md"></div>
        ))}
    </div>
);

export const AlbumSkeleton: React.FC = () => (
     <div className="flex flex-wrap items-center gap-2 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full"></div>
        ))}
    </div>
);
