import { Articles } from '@myTypes/articles';
import { parseJsonStrToDate } from '@lib/format';

/**
 * Sort Articles from newest to oldest
 * @param articles - article data list
 */
export const sortArticlesByDateDesc = (articles: Articles) => {
  articles.sort((a, b) => {
    return parseJsonStrToDate(a.date) > parseJsonStrToDate(b.date) ? -1 : 1;
  });

  return articles;
};
