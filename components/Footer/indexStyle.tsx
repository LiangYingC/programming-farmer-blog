import styled from '@emotion/styled';

export const FooterWrapper = styled.footer`
  padding: 30px 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
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
