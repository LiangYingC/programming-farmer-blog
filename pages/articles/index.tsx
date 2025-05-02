import { GetStaticProps } from 'next';
import { Articles } from '@myTypes/articles';
import { Locale } from '@myTypes/locale';
import { getAllArticles } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import { useTranslation } from '@hooks/useTranslation';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';
import { DEFAULT_LOCALE } from '@constants/locales';
import { DOMAIN } from '@constants/domain';

interface AllArticlesPageProps {
  articles: Articles;
}

const AllArticlesPage = ({ articles }: AllArticlesPageProps) => {
  const { t } = useTranslation();
  return (
    <Layout
      pageType="website"
      pageTitle={t('page.articles_title')}
      pageDesc={t('page.articles_description')}
      pageURL={`${DOMAIN}/articles`}
    >
      <ArticleList articleIntro={'All Articles'} articles={articles} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const currentLocale = (locale || DEFAULT_LOCALE) as Locale;
  const articles = getAllArticles(currentLocale);
  const sortedArticles = sortArticlesByDateDesc(articles);
  return {
    props: {
      articles: sortedArticles,
    },
  };
};

export default AllArticlesPage;
