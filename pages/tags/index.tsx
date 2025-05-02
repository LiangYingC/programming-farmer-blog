import { GetStaticProps } from 'next';
import Layout from '@components/Layout';
import ArticleTags from '@components/ArticleTags';
import { getAllArticleTags } from '@lib/fs';
import { useTranslation } from '@hooks/useTranslation';

interface TagsPageProps {
  tags: string[];
}

const TagsPage = ({ tags }: TagsPageProps) => {
  const { t } = useTranslation();
  return (
    <Layout
      pageType="website"
      pageTitle={t('page.tags_title')}
      pageDesc={t('page.tags_description')}
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
