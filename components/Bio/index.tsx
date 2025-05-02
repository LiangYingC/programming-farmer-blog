import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useColorMode } from '@contexts/ColorModeContext';
import { useTranslation } from '@hooks/useTranslation';
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
  const { t } = useTranslation();
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
        <Description>{t('common.intro')}</Description>
        <SupportAndIssueBlock />
      </Intro>
    </BioWrapper>
  );
};

export default Bio;
