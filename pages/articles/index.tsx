import { FC } from 'react';
import styled from '@emotion/styled';
import { GetStaticProps } from 'next';
import { Articles } from '@myTypes/articles';
import { getAllArticles } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';

const Intro = styled.h2`
  margin-bottom: 10px;
  padding: 0 30px;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
`;

const AllArticlesPage: FC<{ articles: Articles }> = ({ articles }) => {
  return (
    <Layout>
      <Intro>Articles</Intro>
      <ArticleList articles={articles} />
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
