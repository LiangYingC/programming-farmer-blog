import { GetStaticProps } from 'next';
import Layout from '@components/Layout';
import Bio from '@components/Bio';
import ArticleTags from '@components/ArticleTags';
import { getAllArticleTags } from '@lib/fs';
import { useTranslation } from '@hooks/useTranslation';

interface HomePageProps {
  tags: string[];
}

const HomePage = ({ tags }: HomePageProps) => {
  const { t } = useTranslation();
  return (
    <Layout
      pageType="website"
      pageTitle={t('page.home_title')}
      pageDesc={t('page.home_description')}
      pageURL="https://www.programfarmer.com"
    >
      <Bio />
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

export default HomePage;
