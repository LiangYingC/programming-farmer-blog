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
    },
    support: {
      help_message: '如果分享的內容對你有幫助，歡迎',
      buy_coffee: '點此小額贊助請我喝杯咖啡',
      issue_message: '如果發現部落格文章內容有誤，或有想進一步討論的內容，歡迎',
      open_issue: '點此前往開 Issues 討論',
      thanks: '，感恩。',
    },
    page: {
      home_title: '城市碼農 | LiangC | 技術部落格',
      home_description: 'LiangC 技術部落格',
      articles_title: '城市碼農 | LiangC | 所有技術文章',
      articles_description:
        '城市碼農技術部落格的所有文章，主題涵蓋 JavaScript、React、Source Code、CSS 等技術文章。',
      tags_title: '城市碼農 | LiangC | 文章分類',
      tags_description:
        '城市碼農技術部落格的所有文章分類，包含 React、JaveScript、Source Code 等分類',
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
    },
    support: {
      help_message: 'If the content was helpful to you, feel free to',
      buy_coffee: 'click here to buy me a coffee',
      issue_message:
        'If you find any errors in the blog content or want to discuss further, please',
      open_issue: 'click here to open an Issue',
      thanks: ', thank you.',
    },
    page: {
      home_title: 'ProgrammingFarmer | LiangC | Technology Blog',
      home_description: 'LiangC Technology Blog',
      articles_title: 'ProgrammingFarmer | LiangC | All Technology Articles',
      articles_description:
        'All technology articles of ProgrammingFarmer, covering JavaScript, React, Source Code, CSS, etc.',
      tags_title: 'ProgrammingFarmer | LiangC | Article Tags',
      tags_description:
        'All article tags of ProgrammingFarmer, including React, JavaScript, Source Code, etc.',
    },
  },
};
