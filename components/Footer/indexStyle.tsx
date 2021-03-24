import styled from '@emotion/styled';

export const DesktopFooterWrapper = styled.footer`
  padding: 30px 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    display: none;
  }
`;

export const SocialLinks = styled.div`
  margin-right: 15px;
`;

export const SocialLink = styled.a`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  padding-top: 5px;
  padding-right: 10px;
  filter: brightness(0.9);
  transition: 0.25s;

  :hover {
    filter: brightness(1);
  }
`;

export const CopyrightWrap = styled.div`
  display: flex;
  align-items: center;
`;

export const CopyrightIcon = styled.span`
  padding-right: 5px;
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

export const MobileFooterWrapper = styled.footer`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    background-color: ${({ theme }) => theme.colors.bgColor2};
  }
`;

export const FooterIcon = styled.div`
  position: relative;
  top: 3px;
  left: 0px;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
`;
