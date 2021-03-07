import { Posts } from '@myTypes/post';
import { parseJsonStrToDate } from '@lib/format';

/**
 * Sort posts from newest to oldest
 */
export const sortPostsByDateDesc = (posts: Posts) => {
  posts.sort((a, b) => {
    console.log({ a, b });
    return parseJsonStrToDate(a.frontmatter.date) > parseJsonStrToDate(b.frontmatter.date) ? -1 : 1;
  });

  return posts;
};
