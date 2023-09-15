import { GetStaticProps } from 'next';
import Layout from '@components/Layout';
import Bio from '@components/Bio';
import ArticleTags from '@components/ArticleTags';
import { getAllArticleTags } from '@lib/fs';

interface HomePageProps {
  tags: string[];
}

const HomePage = ({ tags }: HomePageProps) => {
  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 技術部落格"
      pageDesc="曾為農夫、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。"
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
