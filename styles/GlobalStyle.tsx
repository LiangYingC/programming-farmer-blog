import { Global, css, useTheme } from '@emotion/react';
import emotionNormalize from 'emotion-normalize';

const GlobalStyle = () => {
  const theme = useTheme();

  return (
    <Global
      styles={css`
        ${emotionNormalize}

        html {
          width: 100vw;
          height: auto;
        }

        body {
          font-family: 'HelveticaNeue', Helvetica, Arial, 'Lucida Grande', sans-serif;
          width: 100vw;
          height: auto;
        }
      `}
    />
  );
};

export default GlobalStyle;
