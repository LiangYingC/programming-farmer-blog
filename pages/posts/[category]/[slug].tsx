import { FC } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Frontmatter } from '@myTypes/post';
import { getAllPosts, getPostMatter } from '@lib/fs';
import Post from '@components/Post';

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
  const allPosts = getAllPosts();

  const paths = allPosts.map(({ category, slug }) => {
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

export default PostPage;
