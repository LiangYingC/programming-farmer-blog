import { Locale } from '@myTypes/locale';

export interface Frontmatter {
  title: string;
  description: string;
  year: string;
  date: string;
  tag: string;
}

export interface Article extends Frontmatter {
  slug: string;
  locale: Locale;
}

export type Articles = Article[];
