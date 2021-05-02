import styled from '@emotion/styled';

export const Content = styled.main`
  max-width: 800px;
  padding: 15px;
  margin: 0 auto;
  padding-top: 65px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    padding-top: 45px;
    padding-bottom: 65px;
  }
`;
