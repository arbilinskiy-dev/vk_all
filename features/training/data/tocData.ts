// ХАБ: Данные оглавления центра обучения
// Реэкспорт типов и сборка массива toc из модулей-секций

// Типы
export type { TocItem } from './tocData_types';

// Импорт данных секций
import { tocSection0 } from './tocData_Section0';
import { tocSection1 } from './tocData_Section1';
import { tocSection2 } from './tocData_Section2';
import { tocSection3 } from './tocData_Section3';
import { tocSection4 } from './tocData_Section4';
import { tocSection5 } from './tocData_Section5';
import { tocSection6 } from './tocData_Section6';
import { tocSection7, tocSection8, tocSection9, tocSection10 } from './tocData_Section7_10';

// Импорт типа для аннотации
import type { TocItem } from './tocData_types';

// Собранный массив оглавления — внешний контракт не изменён
export const toc: TocItem[] = [
    tocSection0,
    tocSection1,
    tocSection2,
    tocSection3,
    tocSection4,
    tocSection5,
    tocSection6,
    tocSection7,
    tocSection8,
    tocSection9,
    tocSection10,
];