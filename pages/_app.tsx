import { AppProps } from 'next/app';
import Script from 'next/script';
import { ThemeProvider, Global } from '@emotion/react';
import { ColorModeProvider, useColorMode } from '@contexts/ColorModeContext';
import { defaultTheme, darkThemeColors, lightThemeColors } from '@styles/theme';
import getGlobalStyle from '@styles/getGlobalStyle';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GTAG_ID;

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
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
          }}
        />
        <Component {...pageProps} />
      </ThemeContainer>
    </ColorModeProvider>
  );
};

export default App;
