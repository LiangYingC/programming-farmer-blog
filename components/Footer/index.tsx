import { FC } from 'react';
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai';
import {
  FooterWrapper,
  SocialLinks,
  SocialLink,
  CopyrightWrap,
  CopyrightIcon,
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

const Footer: FC = () => {
  return (
    <FooterWrapper>
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
    </FooterWrapper>
  );
};

export default Footer;
