import { Articles } from '@myTypes/articles';
import { parseJsonStrToDate } from '@lib/format';

/**
 * Sort Articles from newest to oldest
 */
export const sortArticlesByDateDesc = (Articles: Articles) => {
  Articles.sort((a, b) => {
    console.log({ a, b });
    return parseJsonStrToDate(a.frontmatter.date) > parseJsonStrToDate(b.frontmatter.date) ? -1 : 1;
  });

  return Articles;
};
