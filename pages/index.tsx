import { FC, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@components/Layout';
import { useColorMode } from '@contexts/ColorModeContext';
import { allArticlesPaths } from '@configs/paths';
import { capitalizeLetter } from '@lib/format';

const Bio = styled.div`
  margin-top: 60px;
  display: flex;
`;

const RoundImage = styled(Image)`
  border-radius: 50%;
`;

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 545px;
  margin-left: 40px;
`;

const Title = styled.h2`
  flex: none;
  margin: 15px 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
`;

const Divider = styled.span`
  padding: 0 25px;
`;

const Description = styled.p`
  flex: auto;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const SocialLinks = styled.div`
  flex: none;
  display: flex;
  margin-bottom: 20px;
`;

const ButtonBase = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.textColor1};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.bgColor2};
  cursor: pointer;
  transform: scale(1);
  transition: 0.2s;

  :active {
    transform: scale(0.95);
  }
`;

const SocialLink = styled(ButtonBase)`
  padding: 10px 20px;
  margin-right: 15px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  letter-spacing: ${({ theme }) => theme.letterSpacings.wide};
`;

const GoArticleWapper = styled.div`
  padding: 50px 15px;
`;

const GoArticlesBtns = styled.div`
  margin-top: 20px;
  display: flex;
`;

const GoArticlesBtn = styled(ButtonBase)`
  margin-right: 20px;
  padding: 10px 25px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  text-align: center;
`;

const myImages = {
  dark: {
    src: '/assets/dark-mode-me.jpg',
    alt: 'Picture of the author at night.',
  },
  light: {
    src: '/assets/light-mode-me.jpg',
    alt: 'Picture of the author at day.',
  },
};

const socialLinks = [
  {
    site: `GitHub`,
    link: `https://github.com/LiangYingC`,
  },
  {
    site: `Linkedin`,
    link: `https://www.linkedin.com/in/chen-liang-ying-4a0873165/`,
  },
];

const HomePage: FC = () => {
  const { isDark } = useColorMode();

  const initImageState = isDark ? myImages.dark : myImages.light;

  const [imageState, setImageState] = useState(initImageState);

  useEffect(() => {
    if (isDark) {
      setImageState(myImages.dark);
    } else {
      setImageState(myImages.light);
    }
  }, [isDark]);

  return (
    <Layout>
      <Bio>
        <RoundImage src={imageState.src} alt={imageState.alt} width="250" height="250" />
        <Intro>
          <Title>
            LiangC<Divider>|</Divider>Frontend Developer
          </Title>
          <Description>
            曾為農夫、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。
          </Description>
          <SocialLinks>
            {socialLinks.map(({ site, link }) => {
              return (
                <SocialLink key={site} onClick={() => window.open(link, '_blank')}>
                  {site}
                </SocialLink>
              );
            })}
          </SocialLinks>
        </Intro>
      </Bio>
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
