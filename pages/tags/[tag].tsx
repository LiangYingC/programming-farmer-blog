import { GetStaticProps, GetStaticPaths } from 'next';
import { Articles } from '@myTypes/articles';
import { getArticlesByTag, getAllArticleTags } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';
import { useTranslation } from '@hooks/useTranslation';
import { Locale } from '@myTypes/locale';
import { DEFAULT_LOCALE } from '@constants/locales';
import { DOMAIN } from '@constants/domain';

interface TagPageProps {
  tag: string;
  articles: Articles;
}

const TagPage = ({ tag, articles }: TagPageProps) => {
  const { t, locale } = useTranslation();

  return (
    <Layout
      pageType="website"
      pageTitle={`${t('common.title')} | ${tag} ${t('common.article_tag')}`}
      pageDesc={`${t('common.title')}${t('common.article_list')}，${tag} ${t(
        'common.article_tag'
      )}`}
      pageURL={`${DOMAIN}/${locale}/tags/${tag}`}
    >
      <ArticleList
        articleIntro={`${t('common.article_tag')}: ${tag}`}
        articles={articles}
      />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const tag = (params?.tag || '') as string;
  const currentLocale = (locale || DEFAULT_LOCALE) as Locale;
  const articles = getArticlesByTag(tag, currentLocale);
  const sortedArticles = sortArticlesByDateDesc(articles);

  return {
    props: {
      tag,
      articles: sortedArticles,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const supportedLocales = locales || [DEFAULT_LOCALE];

  const paths = supportedLocales.flatMap((locale) => {
    const tags = getAllArticleTags(locale as Locale);
    return tags.map((tag) => ({
      params: { tag },
      locale,
    }));
  });

  return {
    paths,
    fallback: false,
  };
};

export default TagPage;
