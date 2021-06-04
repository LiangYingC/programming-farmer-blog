import React, { FC, ReactNode, forwardRef } from 'react';
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

/**
 * If the Link child is a function component, need to use React.forwardRef to solve “Warning: Function components cannot be given refs.”
 * ref : https://nextjs.org/docs/api-reference/next/link#if-the-child-is-a-function-component
 */
const IconBtn = forwardRef<HTMLAnchorElement, { iconElemenet: ReactNode; href: string }>(
  function IconBtn({ iconElemenet, href }, ref) {
    return (
      <FooterIcon href={href} ref={ref}>
        {iconElemenet}
      </FooterIcon>
    );
  }
);

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
            <Link key={name} href={`/articles/${name}`} passHref>
              <IconBtn iconElemenet={component} href={`/articles/${name}`} />
            </Link>
          );
        })}
      </MobileFooterWrapper>
    </>
  );
};

export default Footer;
