import { FC } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Frontmatter } from '@myTypes/articles';
import { getAllArticles, getArticleMatter } from '@lib/fs';
import Article from '@components/Article';

interface ArticlePageProps {
  frontmatter: Frontmatter;
  content: string;
}

const ArticlePage: FC<ArticlePageProps> = ({ content, frontmatter }) => {
  return <Article content={content} />;
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = (params?.slug || '') as string;
  const category = (params?.category || '') as string;

  const articleFilePath = `${process.cwd()}/contents/Articles/${category}/${slug}.md`;
  const { frontmatter, content } = getArticleMatter(articleFilePath);

  return {
    props: {
      content: `# ${frontmatter.title}\n${content}`,
      frontmatter,
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
