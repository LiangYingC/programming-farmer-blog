export const defaultTheme = {
  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.75rem', // 28px
    '4xl': '2rem', // 32px
    '5xl': '2.25rem', // 36px
    '6xl': '2.5rem', // 40px
    '7xl': '2.75rem', // 44px
    '8xl': '2.75rem', // 48px
    '9xl': '3.75rem', // 60px
  },
  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    none: '1',
    shorter: '1.25',
    short: '1.375',
    base: '1.5',
    tall: '1.625',
    taller: '2',
  },
  letterSpacings: {
    tighter: '-1px',
    tight: '-0.5px',
    normal: '0',
    wide: '0.5px',
    wider: '1px',
    widest: '1.5px',
  },
  zIndexs: {
    auto: 'auto',
    hide: -1,
    base: 0,
    navigater: 100,
    dropdown: 200,
    overlay: 300,
    modal: 400,
    toast: 500,
  },
  borderRadius: {
    none: '0',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '100%',
  },
  breakpoints: {
    mobileS: '360px',
    mobileM: '375px',
    mobileL: '414px',
    tabletS: '768px',
    tabletM: '1024px',
    tabletL: '1280px',
    desktopS: '1366px',
    desktopM: '1440px',
    desktopL: '1920px',
  },
};

export const darkThemeColors = {
  textColor1: '#f9f9f9',
  textColor2: '#e5e5e5',
  textColor3: '#eeeeee',
  textColor4: '#dddddd',
  textColor5: '#cccccc',
  textColor6: '#bbbbbb',
  textBgColor: 'hsla(0, 0%, 100%, 0.1)',
  bgColor1: '#282b30',
  bgColor2: '#202226',
  bgColor3: '#1b1c21',
  heightLightColor: '#ffd479',
  anchorInsetShadow: 'rgb(255, 255, 255, 0.3);',
};

export const lightThemeColors = {
  textColor1: '#333333',
  textColor2: '',
  textColor3: '',
  textColor4: '',
  textColor5: '',
  textColor6: '',
  textBgColor: '',
  bgColor1: '#fcfcfc',
  bgColor2: '#eeeeee',
  bgColor3: '',
  heightLightColor: '#efb540',
  anchorInsetShadow: 'rgb(0, 0, 0, 0.1);',
};

type DefaultTheme = typeof defaultTheme;

export interface Theme extends DefaultTheme {
  colors: {
    textColor1: string;
    textColor2: string;
    textColor3: string;
    textColor4: string;
    textColor5: string;
    textColor6: string;
    textBgColor: string;
    bgColor1: string;
    bgColor2: string;
    bgColor3: string;
    heightLightColor: string;
  };
}
