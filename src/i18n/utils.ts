import en from './en.json';
import ru from './ru.json';

export const languages = { en: 'EN', ru: 'RU' } as const;
export type Lang = keyof typeof languages;
export type Dict = typeof en;

const dicts: Record<Lang, Dict> = { en, ru };

export function useTranslations(lang: Lang): Dict {
  return dicts[lang];
}

/** Путь к странице с учётом base (GitHub Pages) и языка: localePath('ru') -> /Pluxthumb.co/ru/ */
export function localePath(lang: Lang): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return lang === 'en' ? `${base}/` : `${base}/${lang}/`;
}

/** Файл из public/ с учётом base: asset('favicon.svg') -> /Pluxthumb.co/favicon.svg */
export function asset(file: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${file.replace(/^\//, '')}`;
}
