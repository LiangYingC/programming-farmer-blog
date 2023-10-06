import { css } from '@emotion/react';
import emotionNormalize from 'emotion-normalize';
import { Theme } from '@styles/theme';
import 'highlight.js/styles/github-dark.css';

const getGlobalStyle = (theme: Theme) => {
  const globalStyle = css`
    ${emotionNormalize}

    html {
      width: 100vw;
      height: auto;
    }

    body {
      font-family: HelveticaNeue, Helvetica, Arial, 'Lucida Grande', sans-serif;
      width: 100vw;
      height: auto;
      color: ${theme.colors.primaryText};
      background-color: ${theme.colors.bodyBg};
      transition-duration: 0.2s;
      transition-property: background-color, color;
    }

    h1 {
      font-size: ${theme.fontSizes['6xl']};
      font-weight: ${theme.fontWeights.extrabold};
      color: ${theme.colors.primaryText};
      letter-spacing: ${theme.letterSpacings.widest};
      line-height: ${theme.lineHeights.short};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes['4xl']};
      }

      @media (max-width: ${theme.breakpoints.mobileL}) {
        font-size: ${theme.fontSizes['3xl']};
      }
    }

    h2 {
      margin: 30px 0px;
      font-size: ${theme.fontSizes['4xl']};
      font-weight: ${theme.fontWeights.bold};
      color: ${theme.colors.primaryText};
      letter-spacing: ${theme.letterSpacings.widest};
      line-height: ${theme.lineHeights.short};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        margin: 25px 0px;
        font-size: ${theme.fontSizes['2xl']};
      }
    }

    h3 {
      margin: 25px 0px;
      font-size: ${theme.fontSizes['2xl']};
      font-weight: ${theme.fontWeights.semibold};
      color: ${theme.colors.primaryText};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.short};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.xl};
      }
    }

    h4 {
      margin: 20px 0px;
      font-size: ${theme.fontSizes.xl};
      font-weight: ${theme.fontWeights.semibold};
      color: ${theme.colors.primaryText};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.short};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.lg};
      }
    }

    strong {
      margin: 0 1.5px;
      color: ${theme.colors.primaryText};
      letter-spacing: ${theme.letterSpacings.wider};
    }

    p {
      margin: 25px 0px;
      font-size: ${theme.fontSizes.lg};
      color: ${theme.colors.secondText};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.tall};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.md};
      }

      @media (max-width: ${theme.breakpoints.tabletS}) {
        margin: 20px 0px;
      }
    }

    li {
      margin: 15px 0px;
      font-size: ${theme.fontSizes.lg};
      letter-spacing: ${theme.letterSpacings.wider};
      line-height: ${theme.lineHeights.tall};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.md};
      }
    }

    ul,
    ol {
      padding-left: 25px;
      word-break: break-word;
    }

    em {
      font-size: ${theme.fontSizes.md};

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.sm};
      }
    }

    a {
      display: inline-block;
      color: ${theme.colors.primaryText};
      text-decoration: none;
      cursor: pointer;

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.md};
      }
    }

    img {
      width: 100%;
      height: 100%;
    }

    hr {
      margin: 24px auto;
      border: none;
      border-top: 1px dashed ${theme.colors.divideLine};
      opacity: 0.5;
    }

    pre {
      padding: 30px !important;
      font-family: monospace;
      font-size: ${theme.fontSizes.lg};
      line-height: ${theme.lineHeights.base};
      border-radius: ${theme.borderRadius.sm};
      color: ${theme.colors.preColor};
      background-color: ${theme.colors.preElementBg} !important;
      overflow-x: auto;

      .hljs-comment {
        color: ${theme.colors.preHljsCommentColor};
      }

      @media (max-width: ${theme.breakpoints.tabletS}) {
        font-size: ${theme.fontSizes.md};
      }
    }

    p > code,
    li > code {
      padding: 0px 6px 1px 6px;
      color: ${theme.colors.primaryText};
      background-color: ${theme.colors.codeElementBg};
      letter-spacing: ${theme.letterSpacings.wide};
      border-radius: ${theme.borderRadius.xs};
    }

    blockquote {
      margin: 0;
      padding-left: 25px;
      font-style: italic;
      border-left: solid ${theme.colors.primaryText} 5px;

      @media (max-width: ${theme.breakpoints.tabletS}) {
        padding-left: 15px;
        border-left: solid white 4px;
      }
    }
  `;

  return globalStyle;
};

export default getGlobalStyle;
