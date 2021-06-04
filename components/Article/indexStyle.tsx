import styled from '@emotion/styled';

export const ArticleWrapper = styled.article`
  a {
    display: inline;
    box-shadow: inset 0 -6px 0 0 ${({ theme }) => theme.colors.anchorInsetShadow};
    transition: 0.25s;

    :hover {
      box-shadow: inset 0 -2px 0 0 ${({ theme }) => theme.colors.anchorInsetShadow};
    }
  }
`;
