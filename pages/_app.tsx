import { AppProps } from 'next/app';
import { ThemeProvider } from '@emotion/react';
import { theme } from '@styles/theme';
import GlobalStyle from '@styles/GlobalStyle';

const App = ({ Component, pageProps }: AppProps) => {
  console.log({ theme });
  return (
    <ThemeProvider theme={theme}>
      {GlobalStyle}
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;
