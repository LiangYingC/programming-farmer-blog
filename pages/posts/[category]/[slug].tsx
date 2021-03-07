import { FC } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Post from '@components/Post';
import { getAllPostFiles, getPostSlug, getPostMatter } from '@lib/fs';

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

const PostPage: FC<PostPageProps> = ({ content, frontmatter }) => {
  return <Post content={content} />;
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
