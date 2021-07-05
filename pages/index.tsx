import { FC } from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import Layout from '@components/Layout';
import { allArticlesPaths } from '@configs/paths';
import { capitalizeLetter } from '@lib/format';
import Bio from '@components/Bio';

const Title = styled.h2`
  flex: none;
  margin: 15px 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin: 0 auto;
  }
`;

const ButtonBase = styled.div`
  letter-spacing: ${({ theme }) => theme.letterSpacings.wide};
  border: 1px solid ${({ theme }) => theme.colors.primaryText};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.btnBg};
  cursor: pointer;
  transform: scale(1);
  transition: 0.2s;

  :active {
    transform: scale(0.95);
  }
`;

const GoArticleWapper = styled.div`
  padding: 50px 15px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    padding: 30px 0px;
  }
`;

const GoArticlesBtns = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
`;

const GoArticlesBtn = styled(ButtonBase)`
  margin-right: 15px;
  margin-bottom: 15px;
  padding: 10px 25px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    padding: 7px 15px;
  }
`;

const HomePage: FC = () => {
  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 技術部落格"
      pageDesc="曾為農夫、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。"
      pageURL="https://www.programfarmer.com"
    >
      <Bio />
      <GoArticleWapper>
        <Title>Articles Category</Title>
        <GoArticlesBtns>
          {allArticlesPaths.map(({ name, path }) => {
            return (
              <Link key={name} href={`/articles${path}`}>
                <GoArticlesBtn> {capitalizeLetter(name)}</GoArticlesBtn>
              </Link>
            );
          })}
        </GoArticlesBtns>
      </GoArticleWapper>
    </Layout>
  );
};

export default HomePage;
