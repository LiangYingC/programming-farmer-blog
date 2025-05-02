import fs from 'fs';
import matter from 'gray-matter';
import { ARTICLE_YAERS } from '@constants/articles';
import { Frontmatter, Articles } from '@myTypes/articles';
import { Locale } from '@myTypes/locale';
import { DEFAULT_LOCALE } from '@constants/locales';

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
 * Get all articles data
 * @param locale - language locale
 * @return [{ tag, slug, frontmatter } , ...]
 */
export const getAllArticles = (locale: Locale = DEFAULT_LOCALE) => {
  const allArticles: Articles = ARTICLE_YAERS.flatMap((year) => {
    const baseDirectory = `${process.cwd()}/contents/articles/${year}`;

    const localeDirectory = `${baseDirectory}/${locale}`;
    const articlesDirectoryPath = fs.existsSync(localeDirectory)
      ? localeDirectory
      : baseDirectory;

    if (!fs.existsSync(articlesDirectoryPath)) {
      return [];
    }

    const articleFileNames = fs.readdirSync(articlesDirectoryPath);

    const articles = articleFileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((articleFileName) => {
        const articleFilePath = `${articlesDirectoryPath}/${articleFileName}`;
        const { frontmatter } = getArticleMatter(articleFilePath);
        const articleSlug = getArticleSlug(articleFileName);
        return {
          slug: articleSlug,
          title: frontmatter.title,
          year: frontmatter.date.slice(1, 5),
          date: frontmatter.date,
          description: frontmatter.description,
          tag: frontmatter.tag,
          locale,
        };
      });
    return articles;
  });

  return allArticles;
};

/**
 * Get all article tags data
 * @param locale - language locale
 * @return [tag1, tag2...]
 */
export const getAllArticleTags = (locale: Locale = DEFAULT_LOCALE) => {
  const dulplicatedTags: string[] = ARTICLE_YAERS.flatMap((year) => {
    const baseDirectory = `${process.cwd()}/contents/articles/${year}`;

    const localeDirectory = `${baseDirectory}/${locale}`;
    const articlesDirectoryPath = fs.existsSync(localeDirectory)
      ? localeDirectory
      : baseDirectory;

    if (!fs.existsSync(articlesDirectoryPath)) {
      return [];
    }

    const articleFileNames = fs.readdirSync(articlesDirectoryPath);

    const articleTags = articleFileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .flatMap((articleFileName) => {
        const articleFilePath = `${articlesDirectoryPath}/${articleFileName}`;
        const { frontmatter } = getArticleMatter(articleFilePath);
        return frontmatter.tag.split(',').map((item) => item.trim());
      });
    return articleTags;
  });
  return [...new Set(dulplicatedTags)];
};

/**
 * Get articles data of a specific tag
 * @param tagName - article tag name，example：JavaScript、React
 * @param locale - language locale
 * @return [{ tag, slug, frontmatter } , ...]
 */
export const getArticlesByTag = (
  tagName: string,
  locale: Locale = DEFAULT_LOCALE
) => {
  const allArticles = getAllArticles(locale);

  const specificTagArticles = allArticles.filter(({ tag }) =>
    tag.includes(tagName)
  );
  return specificTagArticles;
};
