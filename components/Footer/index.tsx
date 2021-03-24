import { FC } from 'react';
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
    path: '/react',
    getIcon: function getReactIcon() {
      return <FaReact />;
    },
  },
  {
    name: 'javaScript',
    path: '/javaScript',
    getIcon: function getJavascriptIcon() {
      return <IoLogoJavascript />;
    },
  },
  {
    name: 'style',
    path: '/style',
    getIcon: function getCssIcon() {
      return <IoLogoCss3 />;
    },
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
        {mobileFooterConfig.map(({ name, path, getIcon }) => {
          return (
            <FooterIcon key={name}>
              <Link href={`/articles${path}`}>{getIcon()}</Link>
            </FooterIcon>
          );
        })}
      </MobileFooterWrapper>
    </>
  );
};

export default Footer;
