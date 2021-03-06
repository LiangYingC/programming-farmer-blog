import styled from '@emotion/styled';

export const Wrapper = styled.header`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 65px;
  width: 100%;
  max-width: 1300px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.h1`
  padding-left: 20px;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
`;

export const NavItem = styled.div`
  padding: 10px;
  margin-right: 10px;
  cursor: pointer;

  > a {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    letter-spacing: ${({ theme }) => theme.letterSpacings.widest};
  }
`;

export const ColorModeIcon = styled.div`
  position: relative;
  top: 3px;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.heightLightColor};
  transition: 10s;
`;
