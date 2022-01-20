import { FC } from 'react';
import Link from 'next/link';
import { allArticlesPaths } from '@configs/paths';
import { capitalizeLetter } from '@lib/format';
import {
  GoArticleWapper,
  Title,
  GoArticlesBtns,
  GoArticlesBtn,
} from '@components/ArticleCategory/indexStyle';

const ArticleCategory: FC = () => {
  return (
    <GoArticleWapper>
      <Title>Articles Category</Title>
      <GoArticlesBtns>
        {allArticlesPaths.map(({ name, path }) => {
          return (
            <Link key={name} href={`/articles${path}`}>
              <GoArticlesBtn> {capitalizeLetter(name)}</GoArticlesBtn>
            </Link>
          );
        })}
      </GoArticlesBtns>
    </GoArticleWapper>
  );
};

export default ArticleCategory;