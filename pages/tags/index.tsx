import Layout from '@components/Layout';
import ArticleTags from '@components/ArticleTags';

const TagsPage = () => {
  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 文章分類"
      pageDesc="城市碼農技術部落格的所有文章分類，包含 React、JaveScript、Source Code 等分類"
      pageURL="https://www.programfarmer.com/tags"
    >
      <ArticleTags />
    </Layout>
  );
};

export default TagsPage;
