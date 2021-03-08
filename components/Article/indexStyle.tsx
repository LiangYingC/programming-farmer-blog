import styled from '@emotion/styled';

export const ArticleWrapper = styled.article`
  a {
    display: inline;
    box-shadow: inset 0 -5px 0 0 rgba(255, 255, 255, 0.3);
    transition: 0.25s;

    :hover {
      box-shadow: inset 0 0 0 0;
    }
  }
`;
