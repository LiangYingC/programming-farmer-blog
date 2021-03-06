/**
 * Ref about Define a Theme Type : https://emotion.sh/docs/typescript
 * */

import '@emotion/react';

declare module '@emotion/react' {
  import { Theme } from '@styles/theme';
  export interface Theme {
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
      '6xl': string;
      '7xl': string;
      '8xl': string;
      '9xl': string;
    };
    fontWeights: {
      hairline: number;
      thin: number;
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
      black: number;
    };
    lineHeights: {
      normal: string;
      none: string;
      shorter: string;
      short: string;
      base: string;
      tall: string;
      taller: string;
    };
    zIndexs: {
      auto: string;
      hide: number;
      base: number;
      navigater: number;
      dropdown: number;
      overlay: number;
      modal: number;
      toast: number;
    };
    borderRadius: {
      none: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    breakpoints: {
      mobileS: string;
      mobileM: string;
      mobileL: string;
      tabletS: string;
      tabletM: string;
      tabletL: string;
      desktopS: string;
      desktopM: string;
      desktopL: string;
    };
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
      activeColor: string;
    };
  }
}

// You are also able to use a 3rd party theme this way:
