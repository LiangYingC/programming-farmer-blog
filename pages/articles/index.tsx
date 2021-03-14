import { FC } from 'react';
import styled from '@emotion/styled';
import { GetStaticProps } from 'next';
import { Articles } from '@myTypes/articles';
import { getAllArticles } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';

const AllArticlesPage: FC<{ articles: Articles }> = ({ articles }) => {
  return (
    <Layout>
      <ArticleList articleIntro={'Articles'} articles={articles} />
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
