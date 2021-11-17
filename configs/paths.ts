export const articleCategoryPaths = [
  {
    name: 'react',
    path: '/react',
  },
  {
    name: 'redux',
    path: '/redux',
  },
  {
    name: 'javaScript',
    path: '/javaScript',
  },
  {
    name: 'style',
    path: '/style',
  },
];

export const allArticlesPaths = [
  {
    name: 'all',
    path: '/',
  },
  ...articleCategoryPaths,
];
