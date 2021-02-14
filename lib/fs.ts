import fs from 'fs';
import matter from 'gray-matter';
import { categoryPaths } from '@configs/paths';

/**
 * Get file name and category of all posts
 * @return [{category, postFile} , ...]
 */
export const getAllPostFiles = () => {
  const allPostfiles = categoryPaths.reduce((prev, category) => {
    const categoryName = category.name;

    const postsDirectory = `${process.cwd()}/contents/posts/${categoryName}`;
    const postFiles = fs.readdirSync(postsDirectory);

    const postFilesData = postFiles.map(postFile => {
      return {
        category: categoryName,
        postFile: postFile,
      };
    });

    return [...prev, ...postFilesData];
  }, [] as { category: string; postFile: string }[]);

  return allPostfiles;
};

/**
 * Get post file names of a specific category
 * @param categoryName - post category name，example：javaScript、react
 */
export const getPostFilesByCategory = (categoryName: string) => {
  const postsDirectory = `${process.cwd()}/contents/posts/${categoryName}`;
  const postFiles = fs.readdirSync(postsDirectory);

  return postFiles;
};

/**
 * Get slug of a post
 * @param postFiles - a post file name
 */
export const getPostSlug = (postFile: string) => {
  return postFile.replace('.md', '');
};

/**
 * Get frontmatter and content of the markdown post by post file path
 * @param postFilePath - a post file path
 */
export const getPostMatter = (postFilePath: string) => {
  const markdownFileContent = fs.readFileSync(postFilePath, 'utf8').toString();
  const { data, content } = matter(markdownFileContent);

  return { frontmatter: data, content };
};
