import styled from '@emotion/styled';

export const ArticleIntro = styled.h2`
  margin: 30px 0 15px 0;
  padding: 0 5px;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`;

export const ArticleWrapper = styled.article`
  padding: 20px 5px;
  margin: 10px 0;
  transition: 0.25s;

  :hover {
    cursor: pointer;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin: 0;
  }
`;

export const Infos = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primaryText};

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin-bottom: 5px;
  }
`;

export const Category = styled.span`
  margin: 0 10px 0 0;
  padding: 3px 10px;
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primaryText};
  text-align: center;
  letter-spacing: ${({ theme }) => theme.letterSpacings.wide};
  border: 2px solid ${({ theme }) => theme.colors.primaryText};
  border-radius: ${({ theme }) => theme.borderRadius.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const Date = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-style: italic;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  line-height: ${({ theme }) => theme.lineHeights.base};

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin-bottom: 10px;
  }
`;

export const Brief = styled.p`
  margin: 5px 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  letter-spacing: ${({ theme }) => theme.letterSpacings.wider};
  line-height: ${({ theme }) => theme.lineHeights.base};
  color: ${({ theme }) => theme.colors.thirdText};

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;
