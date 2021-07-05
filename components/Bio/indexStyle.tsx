import styled from '@emotion/styled';

export const BioWrapper = styled.div`
  margin-top: 60px;
  display: flex;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin-top: 30px;
    flex-direction: column;
  }
`;

export const RoundImageWrapper = styled.div`
  flex: none;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 40px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tabletS}) {
    margin: 0 auto 20px auto;
  }
`;

export const Intro = styled.div`
  flex: auto;
  display: flex;
  flex-direction: column;
`;

export const Title = styled.h2`
  flex: none;
  margin: 15px 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin: 0 auto;
  }
`;

export const Divider = styled.span`
  padding: 0 25px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    padding: 0 10px;
  }
`;

export const Description = styled.p`
  flex: auto;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const SocialLinks = styled.div`
  flex: none;
  display: flex;

  margin-bottom: 20px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileL}) {
    margin-bottom: 10px;
  }
`;

export const SocialLink = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  padding-top: 5px;
  padding-right: 10px;
  filter: brightness(0.95);
  transition: 0.25s;

  :hover {
    filter: brightness(1);
    cursor: pointer;
  }
`;
