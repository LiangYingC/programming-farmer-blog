import { GetStaticProps, GetStaticPaths } from 'next';
import { Articles } from '@myTypes/articles';
import { getArticlesByTag, getAllArticleTags } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';

interface TagPageProps {
  tag: string;
  articles: Articles;
}

const TagPage = ({ tag, articles }: TagPageProps) => {
  return (
    <Layout
      pageType="website"
      pageTitle={`城市碼農 | LiangC | ${tag} 技術文章`}
      pageDesc={`城市碼農技術部落格中，關於 ${tag} 的文章列表。`}
      pageURL={`https://www.programfarmer.com/tags/${tag}`}
    >
      <ArticleList articleIntro={`Articles about ${tag}`} articles={articles} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const tag = (params?.tag || '') as string;
  const articles = getArticlesByTag(tag);
  const sortedArticles = sortArticlesByDateDesc(articles);

  return {
    props: {
      tag,
      articles: sortedArticles,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllArticleTags().map((tag) => {
    return {
      params: {
        tag,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export default TagPage;
