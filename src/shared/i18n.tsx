import { createContext } from 'react';
import { it } from './locales/it';

export type Key = keyof typeof it;
export type Locale = 'it';
export const LocaleContext = createContext<Locale>('it');

export const translate = (_locale: Locale, key: Key) => it[key];

export function useT() {
  return (key: string) => it[key as Key] ?? key;
}
