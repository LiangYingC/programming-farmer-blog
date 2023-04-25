import fs from 'fs';
import matter from 'gray-matter';
import { ARTICLE_YAERS } from '@constants/articles';
import { Frontmatter, Articles } from '@myTypes/articles';

/**
 * Get slug of a article
 * @param articleFileName - a article file name
 */
export const getArticleSlug = (articleFileName: string) => {
  return articleFileName.replace('.md', '');
};

/**
 * Get frontmatter and content of the markdown article by article file path
 * @param articleFilePath - a article file path
 */
export const getArticleMatter = (articleFilePath: string) => {
  const markdownFileContent = fs
    .readFileSync(articleFilePath, 'utf8')
    .toString();
  const { data, content } = matter(markdownFileContent);
  const frontmatter = {
    ...data,
    date: JSON.stringify(data.date),
  } as Frontmatter;

  return { frontmatter, content };
};

/**
 * Get all articles data by articleTagPaths config
 * @return [{ tag, slug, frontmatter } , ...]
 */
export const getAllArticles = () => {
  const allArticles: Articles = ARTICLE_YAERS.flatMap((year) => {
    const articlesDirectoryPath = `${process.cwd()}/contents/articles/${year}`;
    const articleFileNames = fs.readdirSync(articlesDirectoryPath);

    const articles = articleFileNames.map((articleFileName) => {
      const articleFilePath = `${process.cwd()}/contents/articles/${year}/${articleFileName}`;
      const { frontmatter } = getArticleMatter(articleFilePath);
      const articleSlug = getArticleSlug(articleFileName);
      return {
        slug: articleSlug,
        title: frontmatter.title,
        year: frontmatter.date.slice(1, 5),
        date: frontmatter.date,
        description: frontmatter.description,
        tag: frontmatter.tag,
      };
    });
    return articles;
  });

  return allArticles;
};

/**
 * Get articles data of a specific tag
 * @param tagName - article tag name，example：JavaScript、React
 * @return [{ tag, slug, frontmatter } , ...]
 */
export const getArticlesByTag = (tagName: string) => {
  const allArticles = getAllArticles();

  const specificTagArticles = allArticles.filter(({ tag }) =>
    tag.includes(tagName)
  );
  return specificTagArticles;
};
