import Link from 'next/link';
import { allArticlesPaths } from '@configs/paths';
import { capitalizeLetter } from '@lib/format';
import { sendEvent } from '@lib/gtag';
import {
  GoArticleWapper,
  Title,
  GoArticlesBtns,
  GoArticlesBtn,
} from '@components/ArticleCategory/indexStyle';

const ArticleCategory = () => {
  return (
    <GoArticleWapper>
      <Title>Articles Category</Title>
      <GoArticlesBtns>
        {allArticlesPaths.map(({ name, path }) => {
          return (
            <Link key={name} href={`/articles${path}`} passHref>
              <GoArticlesBtn
                onClick={() => {
                  sendEvent({
                    action: 'category_click',
                    category: 'click',
                    label: path.replace('/', ''),
                  });
                }}
              >
                {capitalizeLetter(name)}
              </GoArticlesBtn>
            </Link>
          );
        })}
      </GoArticlesBtns>
    </GoArticleWapper>
  );
};

export default ArticleCategory;
