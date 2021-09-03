const siteURL = process.env.SITE_URL;

// Document : https://www.npmjs.com/package/next-sitemap
module.exports = {
  siteUrl: siteURL,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  sourceDir: '.next',
  generateRobotsTxt: false,
};
