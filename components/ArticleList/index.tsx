import Link from 'next/link';
import { formatDashDate, capitalizeLetter } from '@lib/format';
import { sendEvent } from '@lib/gtag';
import { Articles } from '@myTypes/articles';
import {
  ArticleIntro,
  ArticleWrapper,
  Infos,
  Tag,
  Date,
  Title,
  Brief,
} from '@components/ArticleList/indexStyle';

interface ArticleListProps {
  articleIntro?: string;
  articles: Articles;
}

const ArticleList = ({ articleIntro, articles }: ArticleListProps) => {
  return (
    <>
      {articleIntro && <ArticleIntro>{articleIntro}</ArticleIntro>}
      {articles.map(({ slug, title, description, year, date, tag }) => {
        const formattedDate = formatDashDate(date);
        return (
          <Link key={title} href={`/articles/${year}/${slug}`} passHref>
            <ArticleWrapper
              onClick={() => {
                sendEvent({
                  action: 'article_click',
                  category: 'click',
                  label: title,
                });
              }}
            >
              <Infos>
                <Tag>{capitalizeLetter(tag)}</Tag>
                <Date>{formattedDate}</Date>
              </Infos>
              <Title>{title}</Title>
              <Brief>{description}</Brief>
            </ArticleWrapper>
          </Link>
        );
      })}
    </>
  );
};

export default ArticleList;
