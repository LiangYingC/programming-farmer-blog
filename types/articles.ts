export interface Frontmatter {
  title: string;
  description: string;
  year: string;
  date: string;
  tag: string;
}

export interface Article extends Frontmatter {
  slug: string;
}

export type Articles = Article[];
