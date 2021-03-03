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
      color: ${theme.colors.textColor1};
      background-color: ${theme.colors.bgColor1};
      transition-duration: 0.2s;
      transition-property: background-color, color;
    }

    a {
      display: inline-block;
      color: ${theme.colors.textColor1};
    }
  `;

  return globalStyle;
};

export default getGlobalStyle;
