import { GetStaticProps } from 'next';
import Layout from '@components/Layout';
import ArticleTags from '@components/ArticleTags';
import { getAllArticleTags } from '@lib/fs';

interface TagsPageProps {
  tags: string[];
}

const TagsPage = ({ tags }: TagsPageProps) => {
  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 文章分類"
      pageDesc="城市碼農技術部落格的所有文章分類，包含 React、JaveScript、Source Code 等分類"
      pageURL="https://www.programfarmer.com/tags"
    >
      <ArticleTags tags={tags} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const tags = getAllArticleTags();
  return {
    props: {
      tags,
    },
  };
};

export default TagsPage;
