import React, { FC } from 'react';
import Link from 'next/link';
import { FaReact } from 'react-icons/fa';
import { IoLogoJavascript, IoLogoCss3 } from 'react-icons/io';
import {
  DesktopFooterWrapper,
  CopyrightWrap,
  CopyrightIcon,
  MobileFooterWrapper,
  FooterIcon,
} from '@components/Footer/indexStyle';

const mobileFooterConfig = [
  {
    name: 'react',
    component: <FaReact />,
  },
  {
    name: 'javaScript',
    component: <IoLogoJavascript />,
  },
  {
    name: 'style',
    component: <IoLogoCss3 />,
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
        {mobileFooterConfig.map(({ name, component }) => {
          return (
            <Link key={name} href={`/articles/${name}`}>
              <FooterIcon href={`/articles/${name}`}>{component}</FooterIcon>
            </Link>
          );
        })}
      </MobileFooterWrapper>
    </>
  );
};

export default Footer;
