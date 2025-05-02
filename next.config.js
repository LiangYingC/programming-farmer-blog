module.exports = {
  swcMinify: true,
  compiler: {
    emotion: true,
  },
  i18n: {
    locales: ['zh-TW', 'en-US'],
    defaultLocale: 'zh-TW',
    localeDetection: false,
  },
  async redirects() {
    return [
      {
        source: '/articles/sourceCode/redux-make-combineReducers',
        destination: '/articles/2022/redux-make-combineReducers',
        permanent: true,
      },
      {
        source:
          '/articles/sourceCode/redux-make-createStore-enhancer-and-applyMiddleware',
        destination:
          '/articles/2021/redux-make-createStore-enhancer-and-applyMiddleware',
        permanent: true,
      },
      {
        source:
          '/articles/sourceCode/redux-make-createStore-getState-dispatch-subscribe',
        destination:
          '/articles/2021/redux-make-createStore-getState-dispatch-subscribe',
        permanent: true,
      },
      {
        source: '/articles/javaScript/javascript-browser-event-loop',
        destination: '/articles/2021/javascript-browser-event-loop',
        permanent: true,
      },
      {
        source: '/articles/javaScript/javascript-shallow-copy-deep-copy',
        destination: '/articles/2021/javascript-shallow-copy-deep-copy',
        permanent: true,
      },
      {
        source:
          '/articles/javaScript/javascript-pass-by-value-pass-by-reference-pass-by-sharing',
        destination:
          '/articles/2021/javascript-pass-by-value-pass-by-reference-pass-by-sharing',
        permanent: true,
      },
      {
        source: '/articles/react/react-depth-jsx',
        destination: '/articles/2021/react-depth-jsx',
        permanent: true,
      },
      {
        source: '/articles/javaScript/javascript-parseInt-parseFloat-Number',
        destination: '/articles/2020/javascript-parseInt-parseFloat-Number',
        permanent: true,
      },
      {
        source: '/articles/javaScript/javascript-var-let-const-for-loop',
        destination: '/articles/2020/javascript-var-let-const-for-loop',
        permanent: true,
      },
      {
        source: '/articles/style/css-float-and-flex',
        destination: '/articles/2019/css-float-and-flex',
        permanent: true,
      },
    ];
  },
};
