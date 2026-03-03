// Глобальные расширения типов Window

interface Window {
    showAppToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}
