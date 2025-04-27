export type Locale = 'zh-TW' | 'en-US';

export interface LocaleContent {
  [key: string]: string | LocaleContent;
}

export type TranslationContent = {
  [L in Locale]: LocaleContent;
};
