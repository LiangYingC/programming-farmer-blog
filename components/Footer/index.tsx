import { FC } from 'react';
import Link from 'next/link';
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai';
import { FaReact } from 'react-icons/fa';
import { IoLogoJavascript, IoLogoCss3 } from 'react-icons/io';
import {
  DesktopFooterWrapper,
  SocialLinks,
  SocialLink,
  CopyrightWrap,
  CopyrightIcon,
  MobileFooterWrapper,
  FooterIcon,
} from '@components/Footer/indexStyle';

const socialLinkList = [
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
        <SocialLinks>
          {socialLinkList.map(({ link, getIcon }) => {
            return (
              <SocialLink href={link} key={link} target="_blank" rel="noreferrer noopener">
                {getIcon()}
              </SocialLink>
            );
          })}
        </SocialLinks>
        <CopyrightWrap>
          <CopyrightIcon>©</CopyrightIcon>
          <span>{new Date().getFullYear()} LiangChen</span>
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
