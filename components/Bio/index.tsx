import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';
import { useColorMode } from '@contexts/ColorModeContext';
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai';

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

const BioWrapper = styled.div`
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

const SocialLink = styled.div`
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

const Bio: FC = () => {
  const { isDarkMode } = useColorMode();
  const initBioImage = isDarkMode ? myImages.dark : myImages.light;
  const [bioImage, setBioImage] = useState(initBioImage);

  useEffect(() => {
    if (isDarkMode) {
      setBioImage(myImages.dark);
    } else {
      setBioImage(myImages.light);
    }
  }, [isDarkMode]);

  return (
    <BioWrapper>
      <RoundImageWrapper>
        <Image src={bioImage.src} alt={bioImage.alt} width="250" height="250" />
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
    </BioWrapper>
  );
};

export default Bio;
