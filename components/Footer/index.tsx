import React, { FC } from 'react';
import Link from 'next/link';
import { BiHome, BiCategoryAlt } from 'react-icons/bi';

import {
  DesktopFooterWrapper,
  CopyrightWrap,
  CopyrightIcon,
  MobileFooterWrapper,
  FooterIcon,
} from '@components/Footer/indexStyle';

const mobileFooterConfig = [
  {
    link: '/',
    component: <BiHome />,
  },
  {
    link: '/category',
    component: <BiCategoryAlt />,
  },
];

const Footer: FC = () => {
  return (
    <>
      <DesktopFooterWrapper>
        <CopyrightWrap>
          <CopyrightIcon>©</CopyrightIcon>
          <span>{new Date().getFullYear()} LiangC. All rights reserved.</span>
        </CopyrightWrap>
      </DesktopFooterWrapper>
      <MobileFooterWrapper>
        {mobileFooterConfig.map(({ link, component }) => {
          return (
            <Link key={link} href={`${link}`}>
              <FooterIcon href={`${link}`}>{component}</FooterIcon>
            </Link>
          );
        })}
      </MobileFooterWrapper>
    </>
  );
};

export default Footer;
