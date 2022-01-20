import styled from '@emotion/styled';

export const Title = styled.h2`
  flex: none;
  margin: 15px 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    margin: 0 auto;
  }
`;

export const ButtonBase = styled.div`
  letter-spacing: ${({ theme }) => theme.letterSpacings.wide};
  border: 1px solid ${({ theme }) => theme.colors.primaryText};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.btnBg};
  cursor: pointer;
  transform: scale(1);
  transition: 0.2s;

  :active {
    transform: scale(0.95);
  }
`;

export const GoArticleWapper = styled.div`
  margin: 30px 5px 15px 5px;
  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
  }
`;

export const GoArticlesBtns = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
`;

export const GoArticlesBtn = styled(ButtonBase)`
  margin-right: 15px;
  margin-bottom: 15px;
  padding: 10px 25px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    padding: 7px 15px;
  }
`;
