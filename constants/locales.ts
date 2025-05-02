import { Locale, TranslationContent } from '@myTypes/locale';

export const DEFAULT_LOCALE: Locale = 'zh-TW';

export const LOCALES: Locale[] = ['zh-TW', 'en-US'];

export const LOCALE_CONFIG: Record<Locale, { locale: Locale; name: string }> = {
  'zh-TW': {
    locale: 'zh-TW',
    name: '繁體中文',
  },
  'en-US': {
    locale: 'en-US',
    name: 'English',
  },
};

export const TRANSLATION_CONTENT: TranslationContent = {
  'zh-TW': {
    common: {
      title: '城市碼農',
      intro:
        '曾為農業現場員工、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。',
      article_list: '文章列表',
      article_tag: '文章標籤',
      allRights_reserved: '版權所有',
      thanks: '謝謝',
    },
  },
  'en-US': {
    common: {
      title: 'ProgrammingFarmer',
      intro:
        'Once an agricultural worker, agricultural product QC, and online course QC, now a frontend engineer. I enjoy cultivation and growth, hoping to grow valuable products.',
      article_list: 'Articles',
      article_tag: 'Article Tag',
      allRights_reserved: 'All rights reserved',
      thanks: 'Thanks',
    },
  },
};
