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

const CategoryPage = ({ category, articles }: CategoryPageProps) => {
  const capitalizedCategory = capitalizeLetter(category);

  return (
    <Layout
      pageType="website"
      pageTitle={`城市碼農 | LiangC | ${capitalizedCategory} 技術文章`}
      pageDesc={`城市碼農技術部落格中，關於 ${capitalizedCategory} 的文章列表。`}
      pageURL={`https://www.programfarmer.com/articles/${category}`}
    >
      <ArticleList
        articleIntro={`Articles about ${capitalizedCategory}`}
        articles={articles}
      />
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
