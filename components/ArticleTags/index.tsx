import Link from 'next/link';
import { capitalizeLetter } from '@lib/format';
import { sendEvent } from '@lib/gtag';
import {
  GoArticleWapper,
  Title,
  GoArticlesBtns,
  GoArticlesBtn,
} from '@components/ArticleTags/indexStyle';

interface ArticleTagsProps {
  tags: string[];
}

const ArticleTags = ({ tags }: ArticleTagsProps) => {
  return (
    <GoArticleWapper>
      <Title>Article Tags</Title>
      <GoArticlesBtns>
        {tags.map((tag) => {
          return (
            <Link key={tag} href={`/tags/${tag}`} passHref>
              <GoArticlesBtn
                onClick={() => {
                  sendEvent({
                    eventName: 'tag_click',
                    eventParams: {
                      tag_title: tag,
                    },
                  });
                }}
              >
                {capitalizeLetter(tag)}
              </GoArticlesBtn>
            </Link>
          );
        })}
      </GoArticlesBtns>
    </GoArticleWapper>
  );
};

export default ArticleTags;
