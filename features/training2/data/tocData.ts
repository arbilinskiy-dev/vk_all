// Хаб-файл: собирает оглавление из секционных подфайлов.
// Внешний контракт (TocItem, toc) остаётся прежним.

// Реэкспорт типа для обратной совместимости
export type { TocItem } from './types';

import type { TocItem } from './types';
import { section0 } from './section0Data';
import { section1 } from './section1Data';
import { section2 } from './section2Data';
import { section3 } from './section3Data';
import { section4 } from './section4Data';
import { section5 } from './section5Data';
import { section6 } from './section6Data';
import { section7 } from './section7Data';
import { section8 } from './section8Data';
import { section9 } from './section9Data';
import { section10 } from './section10Data';

// Собираем полное оглавление из всех разделов
export const toc: TocItem[] = [
    section0,
    section1,
    section2,
    section3,
    section4,
    section5,
    section6,
    section7,
    section8,
    section9,
    section10,
];