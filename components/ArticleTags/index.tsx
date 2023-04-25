import Link from 'next/link';
import { capitalizeLetter } from '@lib/format';
import { sendEvent } from '@lib/gtag';
import { ARTICLE_TAG_PATHS } from '@constants/articles';
import {
  GoArticleWapper,
  Title,
  GoArticlesBtns,
  GoArticlesBtn,
} from '@components/ArticleTags/indexStyle';

const ArticleTags = () => {
  return (
    <GoArticleWapper>
      <Title>Article Tags</Title>
      <GoArticlesBtns>
        {ARTICLE_TAG_PATHS.map(({ name, path }) => {
          return (
            <Link key={name} href={`/tags/${name}`} passHref>
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

export default ArticleTags;
