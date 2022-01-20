import { FC } from 'react';
import { GetStaticProps } from 'next';
import { Articles } from '@myTypes/articles';
import { getAllArticles } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';

const AllArticlesPage: FC<{ articles: Articles }> = ({ articles }) => {
  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 所有技術文章"
      pageDesc="城市碼農技術部落格的所有文章，主題涵蓋 JavaScript、React、Source Code、CSS 等技術文章。"
      pageURL="https://www.programfarmer.com/articles"
    >
      <ArticleList articleIntro={'All Articles'} articles={articles} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const articles = getAllArticles();
  const sortedArticles = sortArticlesByDateDesc(articles);
  return {
    props: {
      articles: sortedArticles,
    },
  };
};

export default AllArticlesPage;
