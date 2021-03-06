import { FC, createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';

interface ColorModeState {
  isDark: boolean;
  toggleColorMode: { (): void } | null;
}

const ColorModeIntialContext: ColorModeState = {
  isDark: true,
  toggleColorMode: null,
};

const ColorModeContext = createContext(ColorModeIntialContext);

export const useColorMode = () => {
  const context = useContext(ColorModeContext);

  if (context.toggleColorMode === null) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }

  return context;
};

export const ColorModeProvider: FC = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Detect whether the user is using the light mode in the os system
    // Ref https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/#os-level
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDark(false);
    }
  }, []);

  const toggleColorMode = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const context = useMemo(
    () => ({
      isDark,
      toggleColorMode,
    }),
    [isDark, toggleColorMode]
  );

  return <ColorModeContext.Provider value={context}>{children}</ColorModeContext.Provider>;
};
