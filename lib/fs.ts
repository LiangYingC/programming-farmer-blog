import fs from 'fs';
import matter from 'gray-matter';
import { categoryPaths } from '@configs/paths';

/**
 * Get file names of all posts
 */
export const getAllPostFiles = () => {
  const allPostfiles = categoryPaths.reduce((prev, category) => {
    const postsDirectory = `${process.cwd()}/contents/posts/${category.name}`;
    const postFiles = fs.readdirSync(postsDirectory);

    return [...prev, ...postFiles];
  }, [] as string[]);

  return allPostfiles;
};

/**
 * Get post file names of a specific category
 * @param categoryName post category name，example：javaScript、react
 */
export const getPostFilesByCategory = (categoryName: string) => {
  if (categoryName) return [''];

  const postsDirectory = `${process.cwd()}/contents/posts/${categoryName}`;
  const postFiles = fs.readdirSync(postsDirectory);

  return postFiles;
};

/**
 * Get slugs of posts
 * @param postFiles a array of post file names
 */
export const getPostsSlugs = (postFiles: string[]) => {
  const postSlugs = postFiles.map(postFile => {
    return postFile.replace('.md', '');
  });

  return postSlugs;
};

/**
 * Get frontmatter and content of a post by post file path
 * @param postFilePath a post file path
 */
export const getPostMatter = (postFilePath: string) => {
  const markdownFile = fs.readFileSync(postFilePath);
  const { data, content } = matter(markdownFile);

  return { frontmatter: data, content };
};
