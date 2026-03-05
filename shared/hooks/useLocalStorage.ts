import { useState, useCallback, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Ошибка чтения ключа localStorage "${key}":`, error);
      return initialValue;
    }
  });

  // При смене ключа (например, per-project) перечитываем значение из localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(`Ошибка чтения ключа localStorage "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((currentValue) => {
          const valueToStore =
            value instanceof Function ? value(currentValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.error(`Ошибка записи в localStorage для ключа “${key}”:`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
};