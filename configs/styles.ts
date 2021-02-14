import { extendTheme, Theme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
};

export const theme: Theme = extendTheme({
  styles: {
    global: ({ colorMode }) => ({
      body: {
        bg: '#21242c',
        color: 'white',
      },
      a: {
        color: colorMode === 'dark' ? 'teal.300' : 'teal.500',
      },
    }),
  },
  config,
});
