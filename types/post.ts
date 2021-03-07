export interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface Post {
  frontmatter: Frontmatter;
  slug: string;
  category: string;
}

export type Posts = Post[];
