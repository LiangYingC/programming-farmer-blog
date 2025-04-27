import fs from 'fs';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Frontmatter } from '@myTypes/articles';
import { getAllArticles, getArticleMatter } from '@lib/fs';
import Article from '@components/Article';
import { Locale } from '@myTypes/locale';
import { DEFAULT_LOCALE } from '@constants/locales';

interface ArticlePageProps {
  frontmatter: Frontmatter;
  content: string;
  articleUrl: string;
}

const ArticlePage = ({
  content,
  frontmatter,
  articleUrl,
}: ArticlePageProps) => {
  return (
    <Article
      content={content}
      pageTitle={frontmatter.title}
      pageDesc={frontmatter.description}
      pageURL={articleUrl}
    />
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = (params?.slug || '') as string;
  const year = (params?.year || '') as string;
  const currentLocale = (locale || DEFAULT_LOCALE) as Locale;

  const localeArticlePath = `${process.cwd()}/contents/articles/${year}/${currentLocale}/${slug}.md`;
  const defaultArticlePath = `${process.cwd()}/contents/articles/${year}/${slug}.md`;

  let articleFilePath = defaultArticlePath;
  try {
    if (fs.existsSync(localeArticlePath)) {
      articleFilePath = localeArticlePath;
    }
  } catch (err) {
    articleFilePath = defaultArticlePath;
  }

  const domain = process.env.SITE_URL || 'https://www.programfarmer.com';
  const { frontmatter, content } = getArticleMatter(articleFilePath);

  return {
    props: {
      content: `# ${frontmatter.title}\n${content}`,
      frontmatter,
      articleUrl: `${domain}/${currentLocale}/articles/${year}/${slug}`,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const supportedLocales = locales || [DEFAULT_LOCALE];

  const paths = supportedLocales.flatMap((locale) => {
    const allArticles = getAllArticles(locale as Locale);
    return allArticles.map(({ slug, year }) => {
      return {
        params: {
          slug,
          year,
        },
        locale,
      };
    });
  });

  return {
    paths,
    fallback: false,
  };
};

export default ArticlePage;
