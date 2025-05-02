const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ARTICLES_DIR = path.join(__dirname, '../contents/articles');
const README_PATH = path.join(__dirname, '../README.md');
const README_ZH_PATH = path.join(__dirname, '../docs/README.zh-TW.md');

const EN_US = 'en-US';
const ZH_TW = 'zh-TW';
const LANGUAGES = [EN_US, ZH_TW];

const TAG_ORDER = [
  'JavaScript',
  'React',
  'Redux',
  'Frontend Infra',
  'CSS',
  'Career',
  'Uncategorized',
];

function getArticleFiles() {
  const years = fs.readdirSync(ARTICLES_DIR).sort((a, b) => b - a);
  const articles = [];

  for (const year of years) {
    const yearPath = path.join(ARTICLES_DIR, year);

    for (const lang of LANGUAGES) {
      const langPath = path.join(yearPath, lang);
      if (!fs.existsSync(langPath)) continue;

      const files = fs.readdirSync(langPath);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(langPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        articles.push({
          year,
          lang,
          slug: file.replace('.md', ''),
          ...data,
        });
      }
    }
  }

  return articles;
}

function groupArticlesByCategory(articles, lang) {
  const grouped = {};

  for (const article of articles) {
    if (article.lang !== lang) continue;

    // Split tags by comma and trim whitespace
    const tags = article.tag
      ? article.tag.split(',').map((t) => t.trim())
      : ['Uncategorized'];

    // Add article to each of its tags
    for (const tag of tags) {
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(article);
    }
  }

  // Sort articles within each category by creation date (descending)
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  }

  return grouped;
}

function generateArticlesMarkdown(articles, lang) {
  const grouped = groupArticlesByCategory(articles, lang);
  const lines = [];

  lines.push(lang === EN_US ? '## Articles\n' : '## 文章列表\n');

  // Use custom tag order
  const sortedTags = Object.keys(grouped).sort((a, b) => {
    const indexA = TAG_ORDER.indexOf(a);
    const indexB = TAG_ORDER.indexOf(b);

    // If both tags are in TAG_ORDER, use the defined order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one tag is in TAG_ORDER, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // For tags not in TAG_ORDER, sort alphabetically
    return a.localeCompare(b);
  });

  for (const tag of sortedTags) {
    lines.push(`### ${tag}\n`);

    for (const article of grouped[tag]) {
      const url = `https://www.programfarmer.com/articles/${article.year}/${article.slug}`;
      lines.push(`- [${article.title}](${url})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function updateReadmeFiles() {
  const articles = getArticleFiles();

  // Update English README
  let readmeContent = fs.readFileSync(README_PATH, 'utf8');
  const enArticlesContent = generateArticlesMarkdown(articles, EN_US);
  readmeContent = readmeContent.replace(
    /## Articles[\s\S]*$/,
    enArticlesContent
  );
  fs.writeFileSync(README_PATH, readmeContent);

  // Update Chinese README
  let readmeZhContent = fs.readFileSync(README_ZH_PATH, 'utf8');
  const zhArticlesContent = generateArticlesMarkdown(articles, ZH_TW);
  readmeZhContent = readmeZhContent.replace(
    /## 文章列表[\s\S]*$/,
    zhArticlesContent
  );
  fs.writeFileSync(README_ZH_PATH, readmeZhContent);
}

updateReadmeFiles();
