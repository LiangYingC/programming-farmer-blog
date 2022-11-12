const SITE_URL = process.env.SITE_URL;

// Document : https://www.npmjs.com/package/next-sitemap
module.exports = {
  siteUrl: SITE_URL,
  changefreq: 'weekly',
  generateIndexSitemap: false,
  generateRobotsTxt: false,
};
