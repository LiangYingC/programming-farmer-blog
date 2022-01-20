import { FC } from 'react';
import Layout from '@components/Layout';
import Bio from '@components/Bio';
import ArticleCategory from '@components/ArticleCategory';

const HomePage: FC = () => {
  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 技術部落格"
      pageDesc="曾為農夫、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。"
      pageURL="https://www.programfarmer.com"
    >
      <Bio />
      <ArticleCategory />
    </Layout>
  );
};

export default HomePage;
