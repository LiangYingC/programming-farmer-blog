const siteURL = process.env.SITE_URL;

// Document : https://www.npmjs.com/package/next-sitemap
module.exports = {
  siteUrl: siteURL,
  changefreq: 'always',
  priority: 0.7,
  sitemapSize: 5000,
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: [`${siteURL}/server-sitemap.xml`],
  },
};
