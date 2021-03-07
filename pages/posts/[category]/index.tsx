import { FC } from 'react';
import styled from '@emotion/styled';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Posts } from '@myTypes/post';
import { categoryPaths } from '@configs/paths';
import { getPostsByCategory } from '@lib/fs';
import { sortPostsByDateDesc } from '@lib/sort';
import Layout from '@components/Layout';
import PostList from '@components/PostList';

interface CategoryPageProps {
  category: string;
  posts: Posts;
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
  const posts = getPostsByCategory(category);
  const sortedPosts = sortPostsByDateDesc(posts);

  return {
    props: {
      category,
      posts: sortedPosts,
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
