import { AppProps } from 'next/app';
import { ThemeProvider, Global } from '@emotion/react';
import { ColorModeProvider, useColorMode } from '@contexts/ColorModeContext';
import { defaultTheme, darkThemeColors, lightThemeColors } from '@styles/theme';
import getGlobalStyle from '@styles/getGlobalStyle';

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
        <Component {...pageProps} />
      </ThemeContainer>
    </ColorModeProvider>
  );
};

export default App;
