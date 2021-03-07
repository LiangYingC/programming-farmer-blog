import fs from 'fs';
import matter from 'gray-matter';
import { categoryPaths } from '@configs/paths';
import { Frontmatter, Posts } from '@myTypes/post';

/**
 * Get slug of a post
 * @param postFileName - a post file name
 */
export const getPostSlug = (postFileName: string) => {
  return postFileName.replace('.md', '');
};

/**
 * Get frontmatter and content of the markdown post by post file path
 * @param postFilePath - a post file path
 */
export const getPostMatter = (postFilePath: string) => {
  const markdownFileContent = fs.readFileSync(postFilePath, 'utf8').toString();
  const { data, content } = matter(markdownFileContent);
  const frontmatter = {
    ...data,
    date: JSON.stringify(data.date),
  } as Frontmatter;

  return { frontmatter, content };
};

/**
 * Make and return posts data by postFileNames and categoryName
 * @param postFileNames - post file names of posts, ex: [javascript-parseInt-parseFloat-Number, javascript-var-let-const-for-loop]
 * @param categoryName - a category name of posts, ex: JavaScript
 * @return [{ category, slug, frontmatter } , ...]
 */
const makePosts = (postFileNames: string[], categoryName: string) => {
  const posts = postFileNames.map(postFileName => {
    // post frontmatter data
    const postFilePath = `${process.cwd()}/contents/posts/${categoryName}/${postFileName}`;
    const { frontmatter } = getPostMatter(postFilePath);

    // post slug data
    const postSlug = getPostSlug(postFileName);

    return {
      category: categoryName,
      slug: postSlug,
      frontmatter,
    };
  });

  return posts;
};

/**
 * Get posts data of a specific category
 * @param categoryName - post category name，example：JavaScript、React
 * @return [{ category, slug, frontmatter } , ...]
 */
export const getPostsByCategory = (categoryName: string) => {
  const postsDirectory = `${process.cwd()}/contents/posts/${categoryName}`;
  const postFileNames = fs.readdirSync(postsDirectory);
  const posts = makePosts(postFileNames, categoryName);

  return posts;
};

/**
 * Get all posts data by categoryPaths config
 * @return [{ category, slug, frontmatter } , ...]
 */
export const getAllPosts = () => {
  const allPosts = categoryPaths.reduce((prev, category) => {
    const categoryName = category.name;
    const posts = getPostsByCategory(categoryName);

    return [...prev, ...posts];
  }, [] as Posts);

  return allPosts;
};
