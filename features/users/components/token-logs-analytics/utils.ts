import { SystemAccount } from '../../../../shared/types';
import { ACCOUNT_COLORS } from './constants';

/**
 * Получить имя аккаунта по ID
 */
export const getAccountName = (accId: string, accounts: SystemAccount[]): string => {
    if (accId === 'env') return 'ENV TOKEN';
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.full_name : accId.slice(0, 8);
};

/**
 * Получить цвет аккаунта по его позиции в списке выбранных
 */
export const getAccountColor = (accId: string, selectedAccountIds: string[]): string => {
    const idx = selectedAccountIds.indexOf(accId);
    return ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length];
};
