import fs from 'fs';
import matter from 'gray-matter';
import { categoryPaths } from '@configs/paths';
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
  const markdownFileContent = fs.readFileSync(articleFilePath, 'utf8').toString();
  const { data, content } = matter(markdownFileContent);
  const frontmatter = {
    ...data,
    date: JSON.stringify(data.date),
  } as Frontmatter;

  return { frontmatter, content };
};

/**
 * Make and return articles data by articleFileNames and categoryName
 * @param articleFileNames - article file names of articles, ex: [javascript-parseInt-parseFloat-Number, javascript-var-let-const-for-loop]
 * @param categoryName - a category name of articles, ex: JavaScript
 * @return [{ category, slug, frontmatter } , ...]
 */
const makeArticles = (articleFileNames: string[], categoryName: string) => {
  const articles = articleFileNames.map(articleFileName => {
    // article frontmatter data
    const articleFilePath = `${process.cwd()}/contents/articles/${categoryName}/${articleFileName}`;
    const { frontmatter } = getArticleMatter(articleFilePath);

    // article slug data
    const articleSlug = getArticleSlug(articleFileName);

    return {
      category: categoryName,
      slug: articleSlug,
      frontmatter,
    };
  });

  return articles;
};

/**
 * Get articles data of a specific category
 * @param categoryName - article category name，example：JavaScript、React
 * @return [{ category, slug, frontmatter } , ...]
 */
export const getArticlesByCategory = (categoryName: string) => {
  const articlesDirectory = `${process.cwd()}/contents/articles/${categoryName}`;
  const articleFileNames = fs.readdirSync(articlesDirectory);
  const articles = makeArticles(articleFileNames, categoryName);

  return articles;
};

/**
 * Get all articles data by categoryPaths config
 * @return [{ category, slug, frontmatter } , ...]
 */
export const getAllArticles = () => {
  const allArticles = categoryPaths.reduce((prev, category) => {
    const categoryName = category.name;
    const articles = getArticlesByCategory(categoryName);

    return [...prev, ...articles];
  }, [] as Articles);

  return allArticles;
};
