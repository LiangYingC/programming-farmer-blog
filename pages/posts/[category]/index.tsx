import { FC } from 'react';
import styled from '@emotion/styled';
import { GetStaticProps, GetStaticPaths } from 'next';
import { categoryPaths } from '@configs/paths';
import { getPostFilesByCategory, getPostMatter, getPostSlug } from '@lib/fs';
import Layout from '@components/Layout';
import PostList from '@components/PostList';

interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
}

interface CategoryPageProps {
  category: string;
  posts: {
    frontmatter: Frontmatter;
    slug: string;
  }[];
}

const Intro = styled.h2`
  margin-bottom: 10px;
  padding: 0 30px;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
`;

const CategoryPage: FC<CategoryPageProps> = ({ category, posts }) => {
  return (
    <Layout>
      <Intro>Articles about {category}</Intro>
      <PostList posts={posts} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = (params?.category || '') as string;

  const postFiles = getPostFilesByCategory(category);

  const posts = postFiles.map(postFile => {
    // post frontmatter data
    const postFilePath = `${process.cwd()}/contents/posts/${category}/${postFile}`;
    const { frontmatter } = getPostMatter(postFilePath);

    // post slug data
    const postSlug = getPostSlug(postFile);

    return {
      frontmatter,
      slug: postSlug,
    };
  });

  return {
    props: {
      category,
      posts,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = categoryPaths.map(({ name }) => {
    return {
      params: {
        category: name,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export default CategoryPage;
