import styled from '@emotion/styled';

export const ArticleWrapper = styled.article`
  a {
    margin: 0 2px;
    padding: 0 3px;
    display: inline;
    box-shadow: inset 0 -6px 0 0 ${({ theme }) => theme.colors.anchorInsetShadow};
    transition: 0.25s;

    :hover {
      box-shadow: inset 0 -2px 0 0 ${({ theme }) => theme.colors.anchorInsetShadow};
    }
  }
`;

export const GoIssueWrapper = styled.p`
  padding: 10px;
  border: solid ${({ theme }) => theme.colors.thirdText} 1px;
  border-radius: ${({ theme }) => theme.borderRadius.xs};
`;
