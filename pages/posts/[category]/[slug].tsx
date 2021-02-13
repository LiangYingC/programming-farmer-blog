import { FC } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { Text } from '@chakra-ui/react';
import { getAllPostFiles, getPostSlug, getPostMatter } from '@lib/fs';
import fs from 'fs';
import ReactMarkdown from 'react-markdown/with-html';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
}

interface PostPageProps {
  frontmatter: Frontmatter;
  content: string;
}

const CodeBlock: FC<{ language: string; value: any }> = ({ language, value }) => {
  return (
    <SyntaxHighlighter language={language} style={vscDarkPlus}>
      {value}
    </SyntaxHighlighter>
  );
};

const PostPage: FC<PostPageProps> = ({ content, frontmatter }) => {
  console.log({ content, frontmatter });
  return (
    <article>
      <ReactMarkdown escapeHtml={false} source={content} renderers={{ code: CodeBlock }} />
    </article>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = (params?.slug || '') as string;
  const category = (params?.category || '') as string;

  const postFilePath = `${process.cwd()}/contents/posts/${category}/${slug}.md`;
  const { frontmatter, content } = getPostMatter(postFilePath);

  return {
    props: {
      content: `# ${frontmatter.title}\n${content}`,
      frontmatter,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allPostFiles = getAllPostFiles();

  const paths = allPostFiles.map(({ category, postFile }) => {
    const postSlug = getPostSlug(postFile);

    return {
      params: {
        category: category,
        slug: postSlug,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export default PostPage;
