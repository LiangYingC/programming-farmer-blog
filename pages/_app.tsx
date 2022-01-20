import { AppProps } from 'next/app';
import Script from 'next/script';
import { ThemeProvider, Global } from '@emotion/react';
import { ColorModeProvider, useColorMode } from '@contexts/ColorModeContext';
import { defaultTheme, darkThemeColors, lightThemeColors } from '@styles/theme';
import getGlobalStyle from '@styles/getGlobalStyle';

const GTAGE_ID = process.env.GTAGE_ID;

const ThemeContainer = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useColorMode();

  const colors = isDarkMode ? darkThemeColors : lightThemeColors;
  const theme = { ...defaultTheme, colors };

  return (
    <ThemeProvider theme={theme}>
      <Global styles={getGlobalStyle(theme)} />
      {children}
    </ThemeProvider>
  );
};

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ColorModeProvider>
      <ThemeContainer>
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${GTAGE_ID}`}
        />
        <Script id="ga-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', ${GTAGE_ID});
          `}
        </Script>
        <Component {...pageProps} />
      </ThemeContainer>
    </ColorModeProvider>
  );
};

export default App;
