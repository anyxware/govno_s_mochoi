export const safeNumber = (value: number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value);
};

export const safeString = (value: string | null | undefined, defaultValue: string = 'Нет данных'): string => {
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  return value;
};

export const safeArray = <T>(value: T[] | null | undefined, defaultValue: T[] = []): T[] => {
  if (!value || !Array.isArray(value)) {
    return defaultValue;
  }
  return value;
};

export const safeObject = <T extends object>(value: T | null | undefined, defaultValue: T = {} as T): T => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultValue;
  }
  return value;
};

export const formatNumber = (value: number | null | undefined, defaultValue: string = '0'): string => {
  const num = safeNumber(value, 0);
  return num.toLocaleString('ru-RU');
};

export const safeDate = (value: string | Date | null | undefined, defaultValue: string = 'Не указана'): string => {
  if (!value) {
    return defaultValue;
  }
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return defaultValue;
    }
    return date.toLocaleDateString('ru-RU');
  } catch {
    return defaultValue;
  }
};

export const hasData = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

export const safeCount = <T>(array: T[] | null | undefined): number => {
  const arr = safeArray(array);
  return arr.length;
};

export const safeGet = <T>(obj: any, key: string, defaultValue: T): T => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  const value = obj[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value as T;
};