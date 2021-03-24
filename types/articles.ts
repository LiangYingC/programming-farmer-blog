export interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface Article {
  frontmatter: Frontmatter;
  slug: string;
  category: string;
}

export type Articles = Article[];
