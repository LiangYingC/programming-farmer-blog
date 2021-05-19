import { FC } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Frontmatter } from '@myTypes/articles';
import { getAllArticles, getArticleMatter } from '@lib/fs';
import Article from '@components/Article';

interface ArticlePageProps {
  frontmatter: Frontmatter;
  content: string;
  articleUrl: string;
}

const ArticlePage: FC<ArticlePageProps> = ({ content, frontmatter, articleUrl }) => {
  return (
    <Article
      content={content}
      pageTitle={frontmatter.title}
      pageDesc={frontmatter.description}
      pageURL={articleUrl}
    />
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = (params?.slug || '') as string;
  const category = (params?.category || '') as string;

  const articleFilePath = `${process.cwd()}/contents/article/${category}/${slug}.md`;
  const { frontmatter, content } = getArticleMatter(articleFilePath);

  return {
    props: {
      content: `# ${frontmatter.title}\n${content}`,
      frontmatter,
      articleUrl: `https://www.programfarmer.com/articles/${category}/${slug}`,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allArticles = getAllArticles();

  const paths = allArticles.map(({ category, slug }) => {
    return {
      params: {
        category,
        slug,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export default ArticlePage;
