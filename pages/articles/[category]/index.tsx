import { FC } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Articles } from '@myTypes/articles';
import { articleCategoryPaths } from '@configs/paths';
import { getArticlesByCategory } from '@lib/fs';
import { sortArticlesByDateDesc } from '@lib/sort';
import { capitalizeLetter } from '@lib/format';
import Layout from '@components/Layout';
import ArticleList from '@components/ArticleList';

interface CategoryPageProps {
  category: string;
  articles: Articles;
}

const CategoryPage: FC<CategoryPageProps> = ({ category, articles }) => {
  const capitalizedCategory = capitalizeLetter(category);

  return (
    <Layout>
      <ArticleList articleIntro={`Articles about ${capitalizedCategory}`} articles={articles} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = (params?.category || '') as string;
  const Articles = getArticlesByCategory(category);
  const sortedArticles = sortArticlesByDateDesc(Articles);

  return {
    props: {
      category,
      articles: sortedArticles,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = articleCategoryPaths.map(({ name }) => {
    return {
      params: {
        category: name,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export default CategoryPage;
