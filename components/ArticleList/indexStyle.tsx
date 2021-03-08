import styled from '@emotion/styled';

export const ArticleWrapper = styled.article`
  padding: 30px;
  transition: 0.25s;

  :hover {
    box-shadow: inset 0 0 12px 1.5px rgba(255, 255, 255, 0.35);
    border-radius: ${({ theme }) => theme.borderRadius.xs};
    cursor: pointer;
  }
`;

export const Infos = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textColor1};
`;

export const Category = styled.span`
  margin: 0 10px 0 0;
  padding: 3px 10px;
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textColor1};
  text-align: center;
  letter-spacing: ${({ theme }) => theme.letterSpacings.wide};
  border: 2px solid ${({ theme }) => theme.colors.textColor1};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
`;

export const Date = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-style: italic;
`;

export const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  line-height: ${({ theme }) => theme.lineHeights.base};
`;

export const Brief = styled.p`
  margin: 5px 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  letter-spacing: ${({ theme }) => theme.letterSpacings.wider};
  line-height: ${({ theme }) => theme.lineHeights.base};
  color: ${({ theme }) => theme.colors.textColor4};
`;
