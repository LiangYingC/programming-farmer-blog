import { TRANSLATION_CONTENT } from '@constants/locales';
import { Locale, LocaleContent } from '@myTypes/locale';

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let translation: LocaleContent = TRANSLATION_CONTENT[locale];

  for (const k of keys) {
    if (
      typeof translation !== 'object' ||
      translation === null ||
      !(k in translation)
    ) {
      return key;
    }
    translation = translation[k] as LocaleContent;
  }

  return typeof translation === 'string' ? translation : key;
}
