import {
  ReactNode,
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import {
  checkIsUserPreferLightModeOnOS,
  setItemToLocalStorage,
  getItemFromLocalStorage,
} from '@lib/window';

enum ColorModeEnum {
  dark = 'dark',
  light = 'light',
}

const COLOR_MODE_STORAGE_KEY = 'colorMode';

interface ColorModeState {
  isDarkMode: boolean;
  toggleColorMode: { (): void } | null;
}

const ColorModeIntialContext: ColorModeState = {
  isDarkMode: true,
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

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [colorMode, setColorMode] = useState(ColorModeEnum.dark);
  const isDarkMode = colorMode === ColorModeEnum.dark;

  const initColorModeFromStorage = (colorModeFromStorage: string) => {
    const isSelectedDarkModeLastTime =
      colorModeFromStorage === ColorModeEnum.dark;
    isSelectedDarkModeLastTime
      ? setColorMode(ColorModeEnum.dark)
      : setColorMode(ColorModeEnum.light);
  };

  const initColorModeFromUserPreferModeOnOS = () => {
    const isUserPreferLightMode = checkIsUserPreferLightModeOnOS();
    if (isUserPreferLightMode) {
      setColorMode(ColorModeEnum.light);
    }
  };

  useEffect(() => {
    const colorModeFromStorage = getItemFromLocalStorage(
      COLOR_MODE_STORAGE_KEY
    );

    colorModeFromStorage !== null
      ? initColorModeFromStorage(colorModeFromStorage)
      : initColorModeFromUserPreferModeOnOS();
  }, []);

  useEffect(() => {
    setItemToLocalStorage({ key: COLOR_MODE_STORAGE_KEY, value: colorMode });
  }, [colorMode]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      return prev === ColorModeEnum.dark
        ? ColorModeEnum.light
        : ColorModeEnum.dark;
    });
  }, []);

  const context = {
    isDarkMode,
    toggleColorMode,
  };

  return (
    <ColorModeContext.Provider value={context}>
      {children}
    </ColorModeContext.Provider>
  );
};
