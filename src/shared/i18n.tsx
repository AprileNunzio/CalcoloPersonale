import { createContext, useContext } from 'react';
import { it } from './locales/it';
import { en } from './locales/en';

export type Key = keyof typeof it;
export type Locale = 'it' | 'en';
export const LocaleContext = createContext<Locale>('it');

export const translate = (locale: Locale, key: Key) => (locale === 'it' ? it : en)[key];

export function useT() {
  const locale = useContext(LocaleContext);
  return (key: string) => (locale === 'it' ? it : en)[key as Key] ?? key;
}
