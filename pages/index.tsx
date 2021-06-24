import { FC, useState, useEffect } from 'react';
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai';
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

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin-top: 30px;
    flex-direction: column;
  }
`;

const RoundImageWrapper = styled.div`
  flex: none;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 40px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin: 0 auto 20px auto;
  }
`;

const Intro = styled.div`
  flex: auto;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  flex: none;
  margin: 15px 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin: 0 auto;
  }
`;

const Divider = styled.span`
  padding: 0 25px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    padding: 0 10px;
  }
`;

const Description = styled.p`
  flex: auto;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const SocialLinks = styled.div`
  flex: none;
  display: flex;
  margin-bottom: 20px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    margin-bottom: 10px;
  }
`;

export const SocialLink = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  padding-top: 5px;
  padding-right: 10px;
  filter: brightness(0.95);
  transition: 0.25s;

  :hover {
    filter: brightness(1);
    cursor: pointer;
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
    site: 'GitHub',
    link: 'https://github.com/LiangYingC',
    getIcon: function getGithubIcon() {
      return <AiFillGithub />;
    },
  },
  {
    site: 'Linkedin',
    link: 'https://www.linkedin.com/in/chen-liang-ying-4a0873165/',
    getIcon: function getLinkedinIcon() {
      return <AiFillLinkedin />;
    },
  },
];

const HomePage: FC = () => {
  const { isDarkMode } = useColorMode();

  const initImageState = isDarkMode ? myImages.dark : myImages.light;

  const [imageState, setImageState] = useState(initImageState);

  useEffect(() => {
    if (isDarkMode) {
      setImageState(myImages.dark);
    } else {
      setImageState(myImages.light);
    }
  }, [isDarkMode]);

  return (
    <Layout
      pageType="website"
      pageTitle="城市碼農 | LiangC | 技術部落格"
      pageDesc="曾為農夫、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。"
      pageURL="https://www.programfarmer.com"
    >
      <Bio>
        <RoundImageWrapper>
          <Image src={imageState.src} alt={imageState.alt} width="250" height="250" />
        </RoundImageWrapper>
        <Intro>
          <Title>
            LiangC<Divider>|</Divider>Frontend Developer
          </Title>
          <Description>
            曾為農夫、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。
          </Description>
          <SocialLinks>
            {socialLinks.map(({ site, link, getIcon }) => {
              return (
                <SocialLink key={site} onClick={() => window.open(link, '_blank')}>
                  <SocialLink>{getIcon()}</SocialLink>
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
