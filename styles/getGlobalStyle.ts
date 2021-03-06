import { css } from '@emotion/react';
import emotionNormalize from 'emotion-normalize';
import { Theme } from '@styles/theme';

const getGlobalStyle = (theme: Theme) => {
  const globalStyle = css`
    ${emotionNormalize}

    html {
      width: 100vw;
      height: auto;
    }

    body {
      font-family: 'HelveticaNeue', Helvetica, Arial, 'Lucida Grande', sans-serif;
      width: 100vw;
      height: auto;
      color: ${theme.colors.textColor2};
      background-color: ${theme.colors.bgColor1};
      transition-duration: 0.2s;
      transition-property: background-color, color;
    }

    h1 {
      font-size: ${theme.fontSizes['6xl']};
      font-weight: ${theme.fontWeights.extrabold};
      color: ${theme.colors.textColor1};
      letter-spacing: ${theme.letterSpacings.widest};
      line-height: ${theme.lineHeights.short};
    }

    h2 {
      margin: 30px 0px;
      font-size: ${theme.fontSizes['4xl']};
      font-weight: ${theme.fontWeights.bold};
      color: ${theme.colors.textColor1};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.shorter};
    }

    h3 {
      margin: 20px 0px;
      font-size: ${theme.fontSizes['2xl']};
      font-weight: ${theme.fontWeights.semibold};
      color: ${theme.colors.textColor1};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.short};
    }

    p {
      margin: 25px 0px;
      font-size: ${theme.fontSizes.lg};
      color: ${theme.colors.textColor1};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.tall};
    }

    li {
      margin: 15px 0;
      font-size: ${theme.fontSizes.lg};
      line-height: ${theme.lineHeights.base};
    }

    a {
      display: inline-block;
      color: ${theme.colors.textColor1};
      text-decoration: none;
      cursor: pointer;
    }

    img {
      width: 100%;
      height: 100%;
    }

    hr {
      margin: 24px auto;
      border: none;
      border-top: 1px dashed ${theme.colors.textColor6};
      opacity: 0.5;
    }

    pre {
      padding: 30px !important;
      font-family: monospace;
      font-size: ${theme.fontSizes.lg};
      line-height: ${theme.lineHeights.base};
      border-radius: ${theme.borderRadius.sm};
      background-color: ${theme.colors.bgColor3} !important;
    }

    p > code,
    li > code {
      padding: 1px 6px 2px 6px;
      color: ${theme.colors.textColor1};
      background-color: ${theme.colors.textBgColor};
      letter-spacing: ${theme.letterSpacings.wide};
      border-radius: ${theme.borderRadius.xs};
    }
  `;

  return globalStyle;
};

export default getGlobalStyle;
