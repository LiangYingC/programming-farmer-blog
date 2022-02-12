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
  const thisYear = new Date().getFullYear();
  return (
    <>
      <DesktopFooterWrapper>
        <CopyrightWrap>
          <CopyrightIcon>©</CopyrightIcon>
          <span>{thisYear} LiangC. All rights reserved.</span>
        </CopyrightWrap>
      </DesktopFooterWrapper>
      <MobileFooterWrapper>
        {mobileFooterConfig.map(({ link, component }) => {
          return (
            <Link key={link} href={`${link}`} passHref>
              <FooterIcon href={`${link}`}>{component}</FooterIcon>
            </Link>
          );
        })}
      </MobileFooterWrapper>
    </>
  );
};

export default Footer;
