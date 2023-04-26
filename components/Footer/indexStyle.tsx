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

export const CopyrightWrap = styled.div`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: ${({ theme }) => theme.letterSpacings.wide};
  color: ${({ theme }) => theme.colors.divideLine};
`;

export const CopyrightIcon = styled.span`
  padding-right: 5px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
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
    background-color: ${({ theme }) => theme.colors.navigationBg};
    box-shadow: 0 -1px 6px 0 rgb(0, 0, 0, 0.2);
  }
`;

export const FooterIcon = styled.div`
  position: relative;
  top: 3px;
  left: 0px;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  padding: 15px;
`;
