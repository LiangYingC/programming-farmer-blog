import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useColorMode } from '@contexts/ColorModeContext';
import SupportAndIssueBlock from '@components/SupportAndIssueBlock';
import {
  BioWrapper,
  RoundImageWrapper,
  Intro,
  Title,
  Divider,
  Description,
} from '@components/Bio/indexStyle';

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
          曾為農業現場員工、農產品品管、線上課程品管，現為前端工程師，喜歡栽培和成長，在城市裡耕耘程式，期望栽種有價值的產品。
        </Description>
        <SupportAndIssueBlock />
      </Intro>
    </BioWrapper>
  );
};

export default Bio;
