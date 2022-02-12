import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useColorMode } from '@contexts/ColorModeContext';
import { AiFillGithub, AiOutlineTwitter } from 'react-icons/ai';
import {
  BioWrapper,
  RoundImageWrapper,
  Intro,
  Title,
  Divider,
  Description,
  SocialLinks,
  SocialLink,
} from '@components/Bio/indexStyle';

const socialLinks = [
  {
    site: 'GitHub',
    link: 'https://github.com/LiangYingC',
    getIcon: function getGithubIcon() {
      return <AiFillGithub />;
    },
  },
  {
    site: 'Twitter',
    link: 'https://twitter.com/LiangCh95173853',
    getIcon: function getTwitterIcon() {
      return <AiOutlineTwitter />;
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

const Bio = () => {
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
              <SocialLink
                key={site}
                onClick={() => window.open(link, '_blank')}
              >
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
